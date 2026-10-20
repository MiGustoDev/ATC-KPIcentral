import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * AnimatedCounter: smoothly interpolates a number using GSAP
 * @param {number} value - numeric target value
 * @param {number} decimals - number of decimal places (default: 0)
 * @param {string} prefix - optional prefix (e.g., '$ ')
 * @param {string} suffix - optional suffix (e.g., '%')
 * @param {number} duration - animation duration in seconds (default: 0.6)
 * @param {string} className - optional css class
 */
export function AnimatedCounter({
  value = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 0.55,
  className = ''
}) {
  const spanRef = useRef(null);
  const currentValRef = useRef({ val: 0 });
  const isFirstRender = useRef(true);

  useEffect(() => {
    const targetVal = typeof value === 'number' && !isNaN(value) ? value : 0;
    
    // First render start point or smooth tween from previous value
    const startVal = isFirstRender.current ? Math.max(0, targetVal * 0.75) : currentValRef.current.val;
    isFirstRender.current = false;
    currentValRef.current.val = startVal;

    const tween = gsap.to(currentValRef.current, {
      val: targetVal,
      duration: duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (spanRef.current) {
          const formatted = currentValRef.current.val.toLocaleString('es-AR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          });
          spanRef.current.textContent = `${prefix}${formatted}${suffix}`;
        }
      }
    });

    return () => {
      tween.kill();
    };
  }, [value, decimals, prefix, suffix, duration]);

  // Initial SSR / hydration fallback
  const initialFormatted = (typeof value === 'number' && !isNaN(value) ? value : 0).toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return (
    <span ref={spanRef} className={className}>
      {prefix}{initialFormatted}{suffix}
    </span>
  );
}
