import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/media";
import type { Depth } from "../data/scenes";

/** สีชั้นมืดของฉาก (--depth-4) และความเข้ม — ต้องตรงกับ .scene__backdrop::after ใน scenes.css */
const SHADE_COLOR = "#06182A";
const OCEAN_SHADE = 0.62;

/**
 * สีน้ำพื้นหลังทั้งหน้า (layer fixed หลังทุกฉาก) — เปลี่ยนตามความลึกของฉากปัจจุบัน --depth-0 → --depth-4
 * ใช้สี "depth + ชั้นมืด" (หน้าตาเดียวกับพื้นฉากที่มีชั้นมืดทับ) ขอบฉากที่ mask จางเป็นโปร่งจึงกลืนเป็นเนื้อเดียว
 * และข้อความที่อยู่ช่วงขอบยังผ่าน contrast · ภาพพื้นหลังของฉาก crossfade ผ่านสีนี้ (ดู useSceneMotion)
 * reduced motion: เปลี่ยนสีเป็นขั้นทันที
 */
export default function OceanBackdrop({ depth }: { depth: Depth }) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useGSAP(() => {
    const base = getComputedStyle(document.documentElement).getPropertyValue(`--depth-${depth}`).trim();
    const color = gsap.utils.interpolate(base, SHADE_COLOR, OCEAN_SHADE);
    const instant = first.current || prefersReducedMotion();
    first.current = false;
    gsap.to(ref.current, { backgroundColor: color, duration: instant ? 0 : 0.8, ease: "power1.out", overwrite: true });
  }, [depth]);

  return <div ref={ref} className="ocean" aria-hidden="true" />;
}
