import type { RefObject } from "react";
import { gsap, useGSAP } from "./gsap";
import { MQ } from "./media";
import { scrollBlockOf } from "./scroll";

// ค่า motion กลางจาก design/motion-notes.md (ตรงกับ --ease-out / --dur-reveal ใน tokens)
export const EASE = "power2.out";
export const REVEAL = { y: 24, duration: 0.7, stagger: 0.08 };
export const SCRUB = 0.6;
const PARALLAX = { bg: 12, fg: 40 }; // px ต่อครึ่งช่วง → เลื่อนรวมไม่เกิน 80px
const CROSSFADE = { min: 0.2, edge: 0.25 }; // ภาพจาง 20% ↔ 100% ใน 25% แรก/สุดท้ายของช่วงที่ฉากอยู่บนจอ

export interface SceneMotionContext {
  isMobile: boolean;
}

/** fade-up เมื่อเลื่อนถึง (เล่นครั้งเดียว) — ใช้เฉพาะภายใน useSceneMotion (reduced motion ไม่ถูกเรียก) */
export function reveal(targets: gsap.TweenTarget, trigger: Element, vars: gsap.TweenVars = {}) {
  return gsap.from(targets, {
    opacity: 0,
    y: REVEAL.y,
    duration: REVEAL.duration,
    stagger: REVEAL.stagger,
    ease: EASE,
    ...vars,
    scrollTrigger: { trigger, start: "top 80%", once: true },
  });
}

/** หัวข้อฉาก (เลขฉาก · หัวข้อ · หัวข้อรอง) fade-up ตามลำดับ */
export function revealHeading(section: HTMLElement) {
  const heading = section.querySelector(".scene-heading");
  if (heading) reveal(heading.children, section);
}

/** รายการการ์ด: จอใหญ่เข้าพร้อมกันแบบ stagger เมื่อกลุ่มเข้าจอ · มือถือ (เรียงแนวตั้ง) ทีละใบเมื่อแต่ละใบเข้าจอ */
export function revealList(items: ArrayLike<Element>, container: Element, isMobile: boolean) {
  if (isMobile) Array.from(items).forEach((item) => reveal(item, item, { stagger: 0 }));
  else reveal(items, container);
}

/**
 * พื้นหลังมาตรฐานของฉาก — timeline เดียว (ScrollTrigger เดียว) ต่อฉาก:
 * - crossfade: ภาพจางเข้าตอนฉากเข้าจอ และจางออกตอนออก → ระหว่างฉากเห็นสีน้ำของ <OceanBackdrop>
 *   จางเฉพาะภาพ — overlay ความอ่านง่าย (.scene__backdrop::after) อยู่ตลอด ข้อความจึงผ่าน contrast
 * - parallax เบาๆ: layer หลังช้า (≈0.2) layer หน้าเร็วกว่า (≈0.8)
 */
function backdropMotion(section: HTMLElement) {
  const bg = section.querySelector(".scene__bg");
  const fg = section.querySelector(".scene__fg");
  const images = [bg, fg].filter((el): el is Element => el !== null);
  if (!images.length) return;

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    // ฉากที่ถูก pin (เช่น 04) วัดจาก pin-spacer เพื่อให้ช่วงรวมระยะ pin ด้วย
    scrollTrigger: { trigger: scrollBlockOf(section), start: "top bottom", end: "bottom top", scrub: SCRUB },
  });
  tl.fromTo(images, { opacity: CROSSFADE.min }, { opacity: 1, duration: CROSSFADE.edge }, 0);
  tl.to(images, { opacity: CROSSFADE.min, duration: CROSSFADE.edge }, 1 - CROSSFADE.edge);
  if (bg) tl.fromTo(bg, { y: -PARALLAX.bg }, { y: PARALLAX.bg, duration: 1 }, 0);
  if (fg) tl.fromTo(fg, { y: PARALLAX.fg }, { y: -PARALLAX.fg, duration: 1 }, 0);
}

/**
 * animation ของฉากทั่วไป (ไม่ใช่ image sequence)
 * - prefers-reduced-motion: ไม่สร้างอะไรเลย เนื้อหาแสดงครบทันที
 * - build ถูกเรียกใหม่เมื่อข้าม breakpoint มือถือ และทุกอย่างถูก revert อัตโนมัติ (useGSAP + matchMedia)
 */
export function useSceneMotion(
  ref: RefObject<HTMLElement | null>,
  /** คืนฟังก์ชัน cleanup ได้ (เช่น ถอด class) — ถูกเรียกเมื่อ revert */
  build?: (section: HTMLElement, ctx: SceneMotionContext) => void | (() => void),
) {
  useGSAP(
    () => {
      const section = ref.current;
      if (!section) return;
      const mm = gsap.matchMedia(section);
      mm.add({ motion: MQ.motion, isMobile: MQ.mobile }, (context) => {
        const { motion, isMobile } = context.conditions as { motion: boolean; isMobile: boolean };
        if (!motion) return;
        const cleanup = build?.(section, { isMobile });
        backdropMotion(section); // หลัง build — ถ้า build สร้าง pin จะได้ pin-spacer แล้ว
        return cleanup;
      });
    },
    { scope: ref },
  );
}
