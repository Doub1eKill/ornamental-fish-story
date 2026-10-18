import { useEffect } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { MQ } from "./media";

/**
 * Scroll assist — "เลื่อนนิดเดียว แล้วช่วยพาไปต่อ"
 * - ผู้ใช้เลื่อนไปทางไหนนิดหนึ่ง (wheel / trackpad / touch / ปุ่มลูกศร) พอหยุด จะเลื่อนต่อให้เองจนถึง
 *   "จุดถัดไปในทิศนั้น" (ข้อความขึ้นครบ / animation จบ / การ์ดใบถัดไป / ขอบฉาก) — ไม่ดึงย้อนกลับ
 * - ระหว่างที่กำลังเลื่อนให้ ผู้ใช้เลื่อนแทรกไม่ได้ (บล็อก wheel / touchmove / ปุ่มเลื่อน) จนกว่าจะถึงจุดหมาย
 *   และรอให้แรงเฉื่อยของ trackpad หยุดก่อนรับการเลื่อนครั้งใหม่ — กันการกระโดดซ้อนหลายจุด
 * - จุดถัดไปไกลเกิน MAX_JUMP หน้าจอ (เนื้อหายาว) → เลื่อนทีละ PAGE หน้าจอ ไม่ข้ามเนื้อหา
 * - ไม่แทรกการเลื่อนที่เกิดจาก Tab/focus, ลิงก์ #ฉาก, ปุ่มกลับด้านบน, คืนตำแหน่งหลัง refresh (pauseScrollAssist)
 * - ปิดทั้งหมดเมื่อ prefers-reduced-motion
 *
 * ฉากต่างๆ ลงทะเบียนจุดของตัวเองผ่าน addSnapPoints() — คืนค่าเป็นตำแหน่ง scrollY จริง (px)
 * section ที่ไม่ถูก pin ได้จุด "ขอบบนชิดจอ" (และ "ขอบล่างชิดจอ" ถ้าสูงกว่าจอ) อัตโนมัติ
 */

type PointsFn = () => number[];
const sources = new Set<PointsFn>();

/** ถือว่าผู้ใช้หยุดเลื่อนแล้ว เมื่อไม่มี scroll event นานเท่านี้ (ms) */
const SETTLE_MS = 120;
/** เลื่อนน้อยกว่านี้ (px) ไม่นับว่าตั้งใจเลื่อน */
const MIN_NUDGE = 6;
/** จุดที่ห่างจากตำแหน่งปัจจุบันน้อยกว่านี้ (px) ถือว่าอยู่ที่จุดนั้นแล้ว */
const EPSILON = 4;
/** ระยะไกลสุดที่จะพาไปถึงจุดถัดไปในครั้งเดียว (เท่าของความสูงจอ) */
const MAX_JUMP = 2;
/** ถ้าไกลกว่า MAX_JUMP เลื่อนทีละเท่านี้ของความสูงจอ */
const PAGE = 0.9;
/** หลังเลื่อนเสร็จ ต้องเงียบ (ไม่มี wheel) นานเท่านี้ก่อนรับการเลื่อนครั้งใหม่ — กินแรงเฉื่อย trackpad (ms) */
const QUIET_MS = 220;

const SCROLL_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Spacebar"]);

export function addSnapPoints(fn: PointsFn): () => void {
  sources.add(fn);
  return () => {
    sources.delete(fn);
  };
}

/** จุดตาม progress (0–1) ของ ScrollTrigger หนึ่งตัว — ใช้กับฉากที่ถูก pin */
export const pointsOnTrigger = (st: ScrollTrigger, progresses: number[]): PointsFn => () =>
  progresses.map((p) => st.start + p * (st.end - st.start));

let pausedUntil = 0;
/** หยุดช่วยเลื่อนชั่วคราว — ใช้ตอนโค้ดเลื่อนหน้าเอง (กลับด้านบน, คืนตำแหน่ง, ลิงก์ #ฉาก) */
export function pauseScrollAssist(ms: number) {
  pausedUntil = Math.max(pausedUntil, performance.now() + ms);
}

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

/** จุดหมายถัดไปจาก y ในทิศ dir (1 ลง / -1 ขึ้น) — null ถ้าไม่มีที่ไปแล้ว */
function nextTarget(y: number, dir: 1 | -1): number | null {
  const max = ScrollTrigger.maxScroll(window);
  const vh = window.innerHeight;
  let best: number | null = null;
  const consider = (raw: number) => {
    const p = gsap.utils.clamp(0, max, raw);
    if ((p - y) * dir <= EPSILON) return; // อยู่ข้างหลังหรือที่เดิม → ไม่ย้อนกลับ
    if (best === null || Math.abs(p - y) < Math.abs(best - y)) best = p;
  };
  sectionPoints().forEach(consider);
  sources.forEach((fn) => fn().forEach(consider));
  // ไม่มีจุดอยู่ข้างหน้า: ไปสุดหน้า (ถ้ายังไม่ถึง)
  if (best === null) best = dir > 0 ? (max - y > EPSILON ? max : null) : y > EPSILON ? 0 : null;
  if (best === null) return null;
  // จุดถัดไปไกลมาก (เนื้อหายาว) → เลื่อนทีละหน้า ไม่ข้ามเนื้อหา
  if (Math.abs(best - y) > vh * MAX_JUMP) return gsap.utils.clamp(0, max, y + dir * vh * PAGE);
  return best;
}

/** เรียกครั้งเดียวที่ App */
export function useScrollAssist() {
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ.motion, () => {
      let tween: gsap.core.Tween | null = null; // กำลังเลื่อนให้อยู่
      let lastSet = 0; // scrollY ที่ tween ตั้งล่าสุด
      let gestureStart: number | null = null; // scrollY ตอนเริ่มเลื่อนรอบนี้
      let settleTimer = 0;
      let lastWheel = 0;
      let touching = false;
      let lockTail = false; // หลังเลื่อนให้เสร็จ: ยังบล็อก wheel จนแรงเฉื่อย trackpad หยุด
      const locked = () => tween !== null || lockTail;

      const finish = () => {
        tween = null;
        gestureStart = null;
        lockTail = true; // ยังบล็อก wheel ต่อจนกว่าจะเงียบ QUIET_MS
        window.setTimeout(function release() {
          if (performance.now() - lastWheel >= QUIET_MS) lockTail = false;
          else window.setTimeout(release, QUIET_MS);
        }, QUIET_MS);
      };

      const glideTo = (target: number) => {
        const from = window.scrollY;
        const distance = Math.abs(target - from);
        const proxy = { y: from };
        lastSet = from;
        tween = gsap.to(proxy, {
          y: target,
          duration: gsap.utils.clamp(0.55, 1.2, (distance / window.innerHeight) * 0.7),
          ease: "power2.inOut",
          onUpdate: () => {
            // ผู้ใช้ลาก scrollbar แย่ง → ยอมปล่อย (บล็อก scrollbar ไม่ได้)
            if (Math.abs(window.scrollY - lastSet) > 40) {
              tween?.kill();
              finish();
              return;
            }
            lastSet = Math.round(proxy.y);
            window.scrollTo(0, lastSet);
          },
          onComplete: finish,
        });
      };

      const settle = () => {
        settleTimer = 0;
        if (touching || tween) return;
        const y = window.scrollY;
        const start = gestureStart;
        gestureStart = null;
        if (start === null || performance.now() < pausedUntil) return;
        const delta = y - start;
        if (Math.abs(delta) < MIN_NUDGE) return;
        const target = nextTarget(y, delta > 0 ? 1 : -1);
        if (target !== null) glideTo(target);
      };

      const onScroll = () => {
        if (tween) return; // scroll ที่เราเลื่อนเอง
        if (performance.now() < pausedUntil) {
          gestureStart = null;
          return;
        }
        // ปกติ wheel/touch/key ตั้งจุดเริ่มไว้ก่อนแล้ว — ที่เหลือ (เช่นลาก scrollbar) เริ่มนับจากตรงนี้
        if (gestureStart === null) gestureStart = window.scrollY;
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(settle, SETTLE_MS);
      };

      // ---- บล็อก input ระหว่างเลื่อนให้ ----
      const onWheel = (e: WheelEvent) => {
        lastWheel = performance.now();
        if (locked()) e.preventDefault();
        else if (gestureStart === null) gestureStart = window.scrollY;
      };
      const onTouchStart = () => {
        touching = true;
        if (!tween && gestureStart === null) gestureStart = window.scrollY;
      };
      const onTouchMove = (e: TouchEvent) => {
        if (tween) e.preventDefault();
      };
      const onTouchEnd = () => {
        touching = false;
        // momentum อาจยังเลื่อนต่อ — settle จาก scroll event ตัวสุดท้าย
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(settle, SETTLE_MS);
      };
      const onKeyDown = (e: KeyboardEvent) => {
        if (!SCROLL_KEYS.has(e.key)) return;
        const t = e.target as HTMLElement | null;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        if (tween) {
          e.preventDefault();
          return;
        }
        if (gestureStart === null) gestureStart = window.scrollY;
      };
      // การเลื่อนจากโค้ด/focus ไม่ใช่ความตั้งใจเลื่อนของผู้ใช้
      const onFocusIn = () => pauseScrollAssist(400);
      const onClick = (e: MouseEvent) => {
        if ((e.target as HTMLElement | null)?.closest('a[href^="#"]')) pauseScrollAssist(800);
      };
      const onResize = () => pauseScrollAssist(600);

      pauseScrollAssist(1200); // ช่วงโหลด/คืนตำแหน่ง/refresh ตอนเปิดหน้า

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
      window.addEventListener("touchcancel", onTouchEnd, { passive: true });
      window.addEventListener("keydown", onKeyDown);
      document.addEventListener("focusin", onFocusIn);
      document.addEventListener("click", onClick);
      window.addEventListener("resize", onResize);

      return () => {
        tween?.kill();
        window.clearTimeout(settleTimer);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("touchcancel", onTouchEnd);
        window.removeEventListener("keydown", onKeyDown);
        document.removeEventListener("focusin", onFocusIn);
        document.removeEventListener("click", onClick);
        window.removeEventListener("resize", onResize);
      };
    });
    return () => mm.revert();
  }, []);
}
