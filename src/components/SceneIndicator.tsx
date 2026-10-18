import { useEffect, useRef, useState } from "react";
import type { SceneMeta } from "../data/scenes";
import { MQ } from "../lib/media";

interface SceneIndicatorProps {
  scenes: SceneMeta[];
  /** index ของฉากปัจจุบัน (จาก useActiveScene) */
  active: number;
  label: string;
}

/**
 * มือถือ: ซ่อนตอนเลื่อนลง (เนื้อหาที่เลื่อนผ่านจะได้ไม่ถูกแถบ fixed ทับขณะอ่าน)
 * แสดงกลับเมื่อเลื่อนขึ้น / อยู่บนสุด / ได้ focus จากคีย์บอร์ด
 * (ไม่โผล่กลับเองตอนหยุดเลื่อน — ตอนหยุดคือตอนที่กำลังอ่านเนื้อหาที่อยู่ใต้แถบพอดี)
 */
function useHideOnScrollDown() {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const mobile = window.matchMedia(MQ.mobile);
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;
      lastY.current = y;
      if (!mobile.matches || y < 40) {
        setHidden(false);
        return;
      }
      if (dy > 4) setHidden(true);
      else if (dy < -4) setHidden(false);
    };
    const onBreakpoint = () => setHidden(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    mobile.addEventListener("change", onBreakpoint);
    return () => {
      window.removeEventListener("scroll", onScroll);
      mobile.removeEventListener("change", onBreakpoint);
    };
  }, []);

  return [hidden, setHidden] as const;
}

/** ตัวบอกฉากมุมขวาบน — ลิงก์ไปแต่ละฉาก ใช้คีย์บอร์ดได้ */
export default function SceneIndicator({ scenes, active, label }: SceneIndicatorProps) {
  const [hidden, setHidden] = useHideOnScrollDown();

  return (
    <nav
      className={`scene-indicator ${hidden ? "is-hidden" : ""}`}
      aria-label={label}
      onFocus={() => setHidden(false)}
    >
      <p className="scene-indicator__count" aria-hidden="true">
        {scenes[active].number} / {scenes[scenes.length - 1].number}
      </p>
      <ol className="scene-indicator__list">
        {scenes.map((scene, index) => (
          <li key={scene.id}>
            <a
              className="scene-indicator__dot"
              href={`#${scene.id}`}
              aria-label={`${scene.number} ${scene.title}`}
              aria-current={index === active ? "step" : undefined}
            />
          </li>
        ))}
      </ol>
    </nav>
  );
}
