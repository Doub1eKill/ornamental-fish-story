// media query กลางสำหรับ gsap.matchMedia() และ CSS (ต้องตรงกับ breakpoint ใน global.css)
export const MQ = {
  mobile: "(max-width: 767px)",
  tablet: "(min-width: 768px) and (max-width: 1023px)",
  desktop: "(min-width: 1024px)",
  wide: "(min-width: 768px)",
  reduced: "(prefers-reduced-motion: reduce)",
  motion: "(prefers-reduced-motion: no-preference)",
} as const;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia(MQ.reduced).matches;
