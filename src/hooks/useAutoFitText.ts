'use client';

import { RefObject, useEffect, useState } from 'react';

interface AutoFitOptions {
    /** Maximum font size in px (user explicit setting). Undefined = read from CSS classes. */
    maxFontSize?: number;
    /** Minimum font size in px. Default: 10 */
    minFontSize?: number;
    /** Text content — re-triggers on change. */
    text: string;
}

interface AutoFitResult {
    /** The fitted font size. Only meaningful when shrinkApplied=true. */
    fittedSize: number;
    /** True only when text overflows and we are actively shrinking. */
    shrinkApplied: boolean;
}

/**
 * Shrinks font size to keep text on one line within its parent container.
 *
 * CRITICAL design decisions to avoid infinite loops and mobile Safari crashes:
 *  - NEVER mutate the real element's position/visibility during measurement.
 *    Instead, clone it to a hidden off-screen container so the real element's
 *    layout is never disturbed (prevents framer-motion paint errors).
 *  - ResizeObserver tracks WIDTH only (height changes from font-size mutations
 *    must NOT re-trigger measurement).
 *  - 10px width threshold ignores micro-changes (mobile address bar ±3px,
 *    framer-motion scale 1.015→1 animation ±5.6px at 375px width).
 *  - An isMeasuring guard prevents re-entrant calls.
 */
export function useAutoFitText<T extends HTMLElement>(
    ref: RefObject<T | null>,
    { maxFontSize, minFontSize = 10, text }: AutoFitOptions
): AutoFitResult {
    const [result, setResult] = useState<AutoFitResult>({
        fittedSize: maxFontSize || 16,
        shrinkApplied: false,
    });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let rafId: number;
        let lastWidth = -1;
        let isMeasuring = false;

        // Persistent hidden measurement container — created once per hook instance.
        // Positioned absolutely off-screen so it never affects document flow.
        const measureContainer = document.createElement('div');
        measureContainer.setAttribute('aria-hidden', 'true');
        Object.assign(measureContainer.style, {
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            visibility: 'hidden',
            pointerEvents: 'none',
            overflow: 'hidden',
        });
        document.body.appendChild(measureContainer);

        const measure = () => {
            if (isMeasuring) return;
            isMeasuring = true;

            try {
                const parent = el.parentElement ?? el;
                const availableWidth = parent.clientWidth;
                if (availableWidth === 0) return;

                // ── Determine target max font size ──────────────────────────
                // When maxFontSize is not explicitly provided, read from the
                // real element's CSS by temporarily clearing our own inline
                // style (so Tailwind classes take effect, not our shrunken value).
                let targetMax: number;
                if (maxFontSize && maxFontSize > 0) {
                    targetMax = maxFontSize;
                } else {
                    const prev = el.style.fontSize;
                    el.style.fontSize = '';  // clear inline → Tailwind CSS takes over
                    targetMax = parseFloat(window.getComputedStyle(el).fontSize) || 16;
                    el.style.fontSize = prev; // restore
                }

                // ── Build a clone for off-screen measurement ────────────────
                // The clone lives in measureContainer — the real element is
                // NEVER moved to absolute/hidden, so no layout disruption.
                const clone = el.cloneNode(true) as HTMLElement;
                const computedStyle = window.getComputedStyle(el);
                Object.assign(clone.style, {
                    position: 'static',
                    visibility: 'hidden',
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                    width: 'auto',
                    maxWidth: 'none',
                    fontFamily: computedStyle.fontFamily,
                    fontWeight: computedStyle.fontWeight,
                    letterSpacing: computedStyle.letterSpacing,
                    fontSize: `${targetMax}px`,
                });
                measureContainer.appendChild(clone);

                // ── Test if text fits at targetMax ─────────────────────────
                if (clone.scrollWidth <= availableWidth) {
                    measureContainer.removeChild(clone);
                    setResult(prev =>
                        prev.fittedSize === targetMax && !prev.shrinkApplied
                            ? prev
                            : { fittedSize: targetMax, shrinkApplied: false }
                    );
                    return;
                }

                // ── Binary search ──────────────────────────────────────────
                let lo = minFontSize;
                let hi = targetMax;
                let best = minFontSize;

                while (lo <= hi) {
                    const mid = Math.floor((lo + hi) / 2);
                    clone.style.fontSize = `${mid}px`;
                    if (clone.scrollWidth <= availableWidth) {
                        best = mid;
                        lo = mid + 1;
                    } else {
                        hi = mid - 1;
                    }
                }

                measureContainer.removeChild(clone);

                setResult(prev =>
                    prev.fittedSize === best && prev.shrinkApplied
                        ? prev
                        : { fittedSize: best, shrinkApplied: true }
                );
            } finally {
                isMeasuring = false;
            }
        };

        rafId = requestAnimationFrame(measure);

        // ── Watch WIDTH only, ignore height changes ──────────────────────
        // Height changes caused by our own font-size mutations must NOT
        // re-trigger the observer — that is the infinite-loop root cause.
        // 10px threshold: ignores mobile address bar (±3px) AND the
        // framer-motion scale 1.015→1 animation (≈5.6px at 375px width).
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const newWidth = Math.round(entry.contentRect.width);
                if (Math.abs(newWidth - lastWidth) < 10) return; // height-only, address-bar, or scale-animation micro-change → skip
                lastWidth = newWidth;
                cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(measure);
            }
        });

        observer.observe(el.parentElement ?? el);

        return () => {
            cancelAnimationFrame(rafId);
            observer.disconnect();
            if (measureContainer.parentNode) {
                document.body.removeChild(measureContainer);
            }
        };
    }, [text, maxFontSize, minFontSize]);

    return result;
}
