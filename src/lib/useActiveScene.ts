import { useState } from "react";
import { ScrollTrigger, useGSAP } from "./gsap";
import type { SceneMeta } from "../data/scenes";

/**
 * index ของฉากปัจจุบัน = ฉากสุดท้ายที่หัวฉากเลื่อนผ่านกึ่งกลางจอแล้ว
 * แหล่งเดียวที่ทั้งตัวบอกฉากและสีน้ำพื้นหลังใช้ร่วมกัน (ScrollTrigger 1 ชุด แทน 2 ชุดที่ตรวจจับสิ่งเดียวกัน)
 *
 * - ใช้เฉพาะ start (ScrollTrigger ชดเชยระยะของฉากที่ถูก pin ให้เอง) แทน "bottom" ของ section
 *   ซึ่งสั้นกว่าระยะ scroll จริงของฉากที่ pin และทำให้เกิดช่วงที่ไม่มีฉากไหน active
 * - เทียบ scrollY กับ start ตรงๆ — ไม่พึ่ง progress ของ trigger อื่นที่อาจยังไม่อัปเดตในจังหวะ callback
 */
export function useActiveScene(scenes: SceneMeta[]) {
  const [active, setActive] = useState(0);

  useGSAP(() => {
    const triggers: ScrollTrigger[] = []; // ประกาศก่อน — callback ถูกเรียกได้ตั้งแต่ตอน create
    const update = () => {
      const y = window.scrollY;
      let current = 0;
      triggers.forEach((t, i) => {
        if (y >= t.start) current = i;
      });
      setActive(current);
    };
    for (const scene of scenes) {
      triggers.push(
        ScrollTrigger.create({
          trigger: `#${scene.id}`,
          start: "top center",
          end: "max",
          // คำนวณหลัง trigger ของฉากที่ pin — hook นี้ถูกเรียกใน component ที่ mount ก่อน <main>
          refreshPriority: -1,
          onToggle: update,
          // กระโดดข้ามทั้งช่วง (เช่น End/Home) จะไม่ toggle แต่จะ leave
          onLeave: update,
          onLeaveBack: update,
        }),
      );
    }
    // หลัง refresh (resize, ข้าม breakpoint, คืนตำแหน่ง scroll) ตำแหน่ง start เปลี่ยน
    ScrollTrigger.addEventListener("refresh", update);
    return () => ScrollTrigger.removeEventListener("refresh", update);
  }, [scenes]);

  return active;
}
