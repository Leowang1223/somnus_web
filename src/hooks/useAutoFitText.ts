'use client';

import { RefObject, useEffect, useState, useRef } from 'react';

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
 * DEAD LOOP ROOT CAUSE (why previous ResizeObserver caused jumping):
 *   font-size changes → element/parent dimensions change → ResizeObserver fires
 *   → re-measurement → font-size changes again → infinite loop.
 *   When the parent also has transition-all, the 700ms animation fires the
 *   observer ~42 times (60fps × 700ms), making the loop visible as "jumping".
 *
 * FIX: Watch window.resize ONLY (not the element or its parent).
 *   Window resize is completely decoupled from font-size mutations.
 *   Font-size changes CANNOT trigger window resize → loop impossible.
 *
 * Additional safeguards:
 *   - isCalculatingRef prevents re-entrant calls
 *   - debounce 150ms merges rapid resize events (mobile address bar: ±3px)
 *   - Clone-based off-screen measurement: real element is NEVER mutated during measure
 *   - Direct DOM apply before setState: no visual flicker between calculation and re-render
 */
export function useAutoFitText<T extends HTMLElement>(
    ref: RefObject<T | null>,
    { maxFontSize, minFontSize = 10, text }: AutoFitOptions
): AutoFitResult {
    const [result, setResult] = useState<AutoFitResult>({
        fittedSize: maxFontSize || 16,
        shrinkApplied: false,
    });

    // Ref guard — prevents concurrent calculations even across async boundaries
    const isCalculatingRef = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Persistent hidden measurement container — lives off-screen, never affects layout
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
            if (isCalculatingRef.current) return;
            isCalculatingRef.current = true;

            try {
                const parent = el.parentElement ?? el;
                const availableWidth = parent.clientWidth;
                if (availableWidth === 0) return;

                // ── Determine target max font size ──────────────────────────
                let targetMax: number;
                if (maxFontSize && maxFontSize > 0) {
                    targetMax = maxFontSize;
                } else {
                    // Temporarily clear inline style so we read the CSS class value,
                    // not any previously shrunken value we set.
                    const prev = el.style.fontSize;
                    el.style.fontSize = '';
                    targetMax = parseFloat(window.getComputedStyle(el).fontSize) || 16;
                    el.style.fontSize = prev;
                }

                // ── Clone-based off-screen measurement ──────────────────────
                // The real element is NEVER moved or mutated during measurement.
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

                if (clone.scrollWidth <= availableWidth) {
                    // Text fits at max — restore normal rendering
                    measureContainer.removeChild(clone);
                    // Direct DOM apply first (immediate visual, no flicker)
                    el.style.fontSize = '';
                    el.style.whiteSpace = '';
                    // Then sync React state
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

                // Direct DOM apply first — prevents visible flicker between now and re-render
                el.style.fontSize = `${best}px`;
                el.style.whiteSpace = 'nowrap';
                // Then sync React state
                setResult(prev =>
                    prev.fittedSize === best && prev.shrinkApplied
                        ? prev
                        : { fittedSize: best, shrinkApplied: true }
                );
            } finally {
                isCalculatingRef.current = false;
            }
        };

        // ── Debounced window resize listener ────────────────────────────────
        // KEY: window.resize is completely decoupled from font-size mutations.
        // No matter how many times we change el.style.fontSize, window.resize
        // never fires → the dead loop is architecturally impossible.
        let debounceTimer: ReturnType<typeof setTimeout>;
        const debouncedMeasure = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(measure, 150);
        };

        // Initial measurement on mount
        let rafId = requestAnimationFrame(measure);

        window.addEventListener('resize', debouncedMeasure, { passive: true });

        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(debounceTimer);
            window.removeEventListener('resize', debouncedMeasure);
            if (measureContainer.parentNode) {
                document.body.removeChild(measureContainer);
            }
        };
    }, [text, maxFontSize, minFontSize]);

    return result;
}
