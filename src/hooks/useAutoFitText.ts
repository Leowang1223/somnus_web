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
 * CRITICAL design decisions to avoid infinite loops:
 *  - ResizeObserver tracks WIDTH only (height changes from our own font-size
 *    mutations must NOT re-trigger measurement — that is the main cause of
 *    the "jumping" background / animation loop).
 *  - An isMeasuring guard prevents re-entrant calls.
 *  - When maxFontSize is undefined, we read the CSS-based size by temporarily
 *    clearing the inline style so we read Tailwind classes, not our own output.
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

        const measure = () => {
            if (isMeasuring) return;
            isMeasuring = true;

            try {
                const parent = el.parentElement ?? el;
                const availableWidth = parent.clientWidth;
                if (availableWidth === 0) return;

                // ── Determine target max font size ──────────────────────────
                // When maxFontSize is not explicitly provided, read from CSS
                // by temporarily clearing any inline style we may have set.
                // This prevents reading our own shrunken value as the "max".
                let targetMax: number;
                if (maxFontSize && maxFontSize > 0) {
                    targetMax = maxFontSize;
                } else {
                    const prev = el.style.fontSize;
                    el.style.fontSize = '';  // clear inline → Tailwind CSS takes over
                    targetMax = parseFloat(window.getComputedStyle(el).fontSize) || 16;
                    el.style.fontSize = prev; // restore
                }

                // ── Test if text fits at targetMax ─────────────────────────
                // Save current inline values and measure with a temporary
                // position:absolute clone to avoid changing the document flow.
                const savedFS = el.style.fontSize;
                const savedWS = el.style.whiteSpace;
                const savedPos = el.style.position;
                const savedVis = el.style.visibility;

                // Take element out of flow during measurement to prevent
                // height changes from propagating to parent → no observer loop
                el.style.position = 'absolute';
                el.style.visibility = 'hidden';
                el.style.whiteSpace = 'nowrap';
                el.style.fontSize = `${targetMax}px`;

                if (el.scrollWidth <= availableWidth) {
                    // Fits at max — restore and report no shrinking needed
                    el.style.position = savedPos;
                    el.style.visibility = savedVis;
                    el.style.fontSize = savedFS;
                    el.style.whiteSpace = savedWS;

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
                    el.style.fontSize = `${mid}px`;
                    if (el.scrollWidth <= availableWidth) {
                        best = mid;
                        lo = mid + 1;
                    } else {
                        hi = mid - 1;
                    }
                }

                // Restore ALL inline styles before setting state
                // (React will apply the new fittedSize via the style prop)
                el.style.position = savedPos;
                el.style.visibility = savedVis;
                el.style.fontSize = savedFS;
                el.style.whiteSpace = savedWS;

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
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const newWidth = Math.round(entry.contentRect.width);
                if (newWidth === lastWidth) return; // height-only change → skip
                lastWidth = newWidth;
                cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(measure);
            }
        });

        observer.observe(el.parentElement ?? el);

        return () => {
            cancelAnimationFrame(rafId);
            observer.disconnect();
        };
    }, [text, maxFontSize, minFontSize]);

    return result;
}
