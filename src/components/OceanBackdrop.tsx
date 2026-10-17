import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/media";
import type { Depth } from "../data/scenes";

/**
 * สีน้ำพื้นหลังทั้งหน้า (layer fixed หลังทุกฉาก) — เปลี่ยนตามความลึกของฉากปัจจุบัน --depth-0 → --depth-4
 * ภาพพื้นหลังของฉากจางเข้า/ออกที่ขอบฉาก (crossfade ผ่านสีนี้) — ดู useSceneMotion
 * reduced motion: เปลี่ยนสีเป็นขั้นทันที
 */
export default function OceanBackdrop({ depth }: { depth: Depth }) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useGSAP(() => {
    const color = getComputedStyle(document.documentElement).getPropertyValue(`--depth-${depth}`).trim();
    const instant = first.current || prefersReducedMotion();
    first.current = false;
    gsap.to(ref.current, { backgroundColor: color, duration: instant ? 0 : 0.8, ease: "power1.out", overwrite: true });
  }, [depth]);

  return <div ref={ref} className="ocean" aria-hidden="true" />;
}
