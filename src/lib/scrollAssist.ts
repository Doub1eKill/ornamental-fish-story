import { useEffect } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { MQ } from "./media";

/**
 * Scroll assist — "แม่เหล็ก" ช่วยหยุดตรงจังหวะที่ดี
 * - หลังผู้ใช้หยุดเลื่อน ถ้าอยู่ใกล้จุดสำคัญ (ข้อความขึ้นครบ / animation จบ / การ์ดอยู่กลางจอ)
 *   จะเลื่อนเข้าไปหยุดตรงนั้นเองแบบนุ่มๆ · ถ้าอยู่ไกลทุกจุด ปล่อยให้เลื่อนอิสระตามปกติ
 * - ไม่ล็อก scroll ไม่แย่งการควบคุม: เลื่อนต่อเมื่อไหร่ snap ถูกยกเลิกทันที
 * - ปิดทั้งหมดเมื่อ prefers-reduced-motion
 *
 * ฉากต่างๆ ลงทะเบียนจุดของตัวเองผ่าน addSnapPoints() — คืนค่าเป็นตำแหน่ง scrollY จริง (px)
 * section ที่ไม่ถูก pin ได้จุด "ขอบบนชิดจอ" (และ "ขอบล่างชิดจอ" ถ้าสูงกว่าจอ) อัตโนมัติ
 */

type PointsFn = () => number[];
const sources = new Set<PointsFn>();

/** แรงดูด: snap เฉพาะเมื่อจุดที่ใกล้ที่สุดอยู่ห่างไม่เกิน (สัดส่วนความสูงจอ) */
const PULL = 0.35;

export function addSnapPoints(fn: PointsFn): () => void {
  sources.add(fn);
  return () => {
    sources.delete(fn);
  };
}

/** จุดตาม progress (0–1) ของ ScrollTrigger หนึ่งตัว — ใช้กับฉากที่ถูก pin */
export const pointsOnTrigger = (st: ScrollTrigger, progresses: number[]): PointsFn => () =>
  progresses.map((p) => st.start + p * (st.end - st.start));

/** จุดอัตโนมัติของ section ที่ไม่ได้ถูก pin */
function sectionPoints(): number[] {
  const vh = window.innerHeight;
  const points: number[] = [];
  document.querySelectorAll<HTMLElement>("main > section, main > .pin-spacer > section").forEach((section) => {
    if (section.parentElement?.classList.contains("pin-spacer")) return; // ฉาก pin ลงทะเบียนจุดเอง
    const top = section.getBoundingClientRect().top + window.scrollY;
    points.push(top);
    if (section.offsetHeight > vh * 1.05) points.push(top + section.offsetHeight - vh);
  });
  return points;
}

function nearest(y: number): number | null {
  let best: number | null = null;
  let bestDistance = Infinity;
  const consider = (p: number) => {
    const d = Math.abs(p - y);
    if (d < bestDistance) {
      bestDistance = d;
      best = p;
    }
  };
  sectionPoints().forEach(consider);
  sources.forEach((fn) => fn().forEach(consider));
  return best !== null && bestDistance <= window.innerHeight * PULL ? best : null;
}

/** เรียกครั้งเดียวที่ App */
export function useScrollAssist() {
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      const assist = ScrollTrigger.create({
        start: 0,
        end: "max",
        snap: {
          snapTo: (progress) => {
            const max = ScrollTrigger.maxScroll(window);
            if (max <= 0) return progress;
            const target = nearest(progress * max);
            return target === null ? progress : gsap.utils.clamp(0, 1, target / max);
          },
          delay: 0.15, // รอให้หยุดเลื่อนจริงก่อน
          duration: { min: 0.35, max: 0.9 },
          ease: "power2.inOut",
          inertia: false,
        },
      });
      return () => assist.kill();
    });
    return () => mm.revert();
  }, []);
}
