import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Register GSAP plugins if needed
gsap.registerPlugin(useGSAP);

/**
 * Hook to animate elements in with a subtle stagger and fade-in
 */
export function useStaggerFadeIn(selector, dependencies = [], options = {}) {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const elements = containerRef.current.querySelectorAll(selector);
      if (!elements || elements.length === 0) return;

      gsap.fromTo(
        elements,
        {
          opacity: 0,
          y: options.y ?? 12,
          scale: options.scale ?? 0.99
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: options.duration ?? 0.45,
          stagger: options.stagger ?? 0.04,
          ease: options.ease ?? 'power2.out',
          overwrite: 'auto'
        }
      );
    },
    { scope: containerRef, dependencies }
  );

  return containerRef;
}

/**
 * Hook to gently animate a single container on mount or dependency change
 */
export function useFadeIn(dependencies = [], options = {}) {
  const ref = useRef(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      gsap.fromTo(
        ref.current,
        {
          opacity: 0,
          y: options.y ?? 10
        },
        {
          opacity: 1,
          y: 0,
          duration: options.duration ?? 0.4,
          ease: options.ease ?? 'power2.out',
          delay: options.delay ?? 0,
          overwrite: 'auto'
        }
      );
    },
    { scope: ref, dependencies }
  );

  return ref;
}
