import { useEffect } from "react";
import { ScrollTrigger } from "./gsap";
import { MQ } from "./media";
import { scrollBlockOf } from "./scroll";

const KEY = "ornamental-fish:scroll-y";

const read = () => {
  try {
    return Number(sessionStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
};

const write = (y: number) => {
  try {
    sessionStorage.setItem(KEY, String(Math.round(y)));
  } catch {
    // private mode / storage ถูกปิด — ไม่จำตำแหน่ง
  }
};

/**
 * จัดการตำแหน่ง scroll เมื่อโหลดหน้า:
 * - refresh กลางหน้า: เบราว์เซอร์คืนตำแหน่งก่อน React render (หน้ายังสั้น) จึงเด้งไปบนสุด
 *   → จำตำแหน่งเองใน sessionStorage แล้วคืนค่าหลัง ScrollTrigger คำนวณ pin เสร็จ
 * - ลิงก์ #scene-xx: element ยังไม่มีตอนเบราว์เซอร์ jump → เลื่อนไปเองหลัง refresh
 * - ฟอนต์ไทยโหลดเสร็จแล้วความสูงข้อความเปลี่ยน → refresh ตำแหน่ง ScrollTrigger อีกครั้ง
 */
export function useScrollRestoration() {
  useEffect(() => {
    let active = true;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    // คืนตำแหน่งเฉพาะ refresh / ย้อนกลับ — เปิดหน้าใหม่เริ่มที่บนสุด
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const saved = nav && (nav.type === "reload" || nav.type === "back_forward") ? read() : 0;
    const save = () => write(window.scrollY);
    window.addEventListener("pagehide", save);

    document.fonts.ready.then(() => {
      if (!active) return;
      ScrollTrigger.refresh();
      const target = location.hash ? document.querySelector<HTMLElement>(decodeURIComponent(location.hash)) : null;
      if (target) target.scrollIntoView();
      else if (saved > 0) window.scrollTo(0, saved);
    });

    // ข้าม breakpoint มือถือ (เช่นหมุนจอ): matchMedia ถอด/สร้าง pin ใหม่ ความสูงหน้าหดชั่วคราวจนเด้งไปบนสุด
    // → จำฉากปัจจุบัน + สัดส่วนภายในฉากไว้ตลอด แล้วกลับไปที่เดิมหลัง ScrollTrigger refresh
    let anchor: { section: HTMLElement; progress: number } | null = null;
    let restoring = false;
    let raf = 0;
    const capture = () => {
      raf = 0;
      if (restoring) return;
      const y = window.scrollY;
      for (const section of document.querySelectorAll<HTMLElement>("main section")) {
        const block = scrollBlockOf(section);
        if (y >= block.offsetTop - 1 && y < block.offsetTop + block.offsetHeight) {
          anchor = { section, progress: (y - block.offsetTop) / block.offsetHeight };
          return;
        }
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(capture);
    };
    const mobileQuery = window.matchMedia(MQ.mobile);
    let timer = 0;
    const restore = () => {
      if (!anchor) return;
      const block = scrollBlockOf(anchor.section);
      window.scrollTo(0, block.offsetTop + anchor.progress * block.offsetHeight);
    };
    const onBreakpoint = () => {
      // listener ของ gsap.matchMedia อาจรัน (และ refresh) ก่อนตัวนี้ → คืนตำแหน่งเองใน tick ถัดไปหลัง rebuild เสร็จ
      restoring = true;
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        ScrollTrigger.refresh();
        restore();
        restoring = false;
      }, 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    mobileQuery.addEventListener("change", onBreakpoint);

    return () => {
      active = false;
      window.removeEventListener("pagehide", save);
      window.removeEventListener("scroll", onScroll);
      mobileQuery.removeEventListener("change", onBreakpoint);
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, []);
}
