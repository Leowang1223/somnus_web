'use client';

import { RefObject, useEffect, useState } from 'react';

interface AutoFitOptions {
    /** Maximum font size in px (from user's explicit setting). 0/undefined = use element's current computed size. */
    maxFontSize?: number;
    /** Minimum font size in px to shrink to. Default: 10 */
    minFontSize?: number;
    /** Text content — triggers re-measurement when changed. */
    text: string;
}

interface AutoFitResult {
    /** Calculated font size that fits without overflow. Equals maxFontSize if text already fits. */
    fittedSize: number;
    /** True when active shrinking is applied (text was too wide at maxFontSize). */
    shrinkApplied: boolean;
}

/**
 * Automatically shrinks font size to keep text in one line within its parent container.
 * Algorithm: ResizeObserver + binary search.
 *
 * Only activates when text overflows at maxFontSize.
 * When shrinkApplied=true, apply { whiteSpace: 'nowrap' } to the element to enforce single-line.
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

        const measure = () => {
            const parent = el.parentElement ?? el;
            const availableWidth = parent.clientWidth;
            if (availableWidth === 0) return;

            // Determine the max font size to test against
            const targetMax = maxFontSize || parseFloat(window.getComputedStyle(el).fontSize) || 16;

            // Save current inline styles
            const savedFontSize = el.style.fontSize;
            const savedWhiteSpace = el.style.whiteSpace;

            // Set to max + nowrap to test if overflow occurs
            el.style.fontSize = `${targetMax}px`;
            el.style.whiteSpace = 'nowrap';

            if (el.scrollWidth <= availableWidth) {
                // Text fits at max size — restore and report no shrinking
                el.style.fontSize = savedFontSize;
                el.style.whiteSpace = savedWhiteSpace;
                setResult(prev =>
                    prev.fittedSize === targetMax && !prev.shrinkApplied
                        ? prev
                        : { fittedSize: targetMax, shrinkApplied: false }
                );
                return;
            }

            // Binary search: find largest size where text fits
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

            // Restore inline styles (React will apply state-based style in next render)
            el.style.fontSize = savedFontSize;
            el.style.whiteSpace = savedWhiteSpace;

            setResult(prev =>
                prev.fittedSize === best && prev.shrinkApplied
                    ? prev
                    : { fittedSize: best, shrinkApplied: true }
            );
        };

        rafId = requestAnimationFrame(measure);

        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(measure);
        });

        observer.observe(el.parentElement ?? el);

        return () => {
            cancelAnimationFrame(rafId);
            observer.disconnect();
        };
    }, [text, maxFontSize, minFontSize]);

    return result;
}
