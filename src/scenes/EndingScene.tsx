import { useRef } from "react";
import BackToTop from "../components/BackToTop";
import SceneShell from "../components/SceneShell";
import { ending, sceneMeta } from "../data/scenes";
import { gsap } from "../lib/gsap";
import { EASE, REVEAL, reveal, useSceneMotion } from "../lib/motion";

const meta = sceneMeta[8];

export default function EndingScene() {
  const ref = useRef<HTMLElement>(null);

  // ฟองอากาศ (scene-09-fg) ลอยขึ้นช้าๆ ตาม scroll — มาจาก parallax ของ useSceneMotion
  // คำถาม → 5 หัวข้อ stagger → ปุ่มกลับด้านบน
  useSceneMotion(ref, (section) => {
    const ending = section.querySelector(".ending")!;
    reveal([section.querySelector(".ending .scene-number")!, section.querySelector(".ending__question")!], ending);
    reveal(section.querySelectorAll(".ending__topics li"), ending, { delay: 0.3 });
    // ปุ่มใช้ opacity อย่างเดียว (ไม่ใช่ autoAlpha) เพื่อให้กด Tab ถึงได้ตลอด แม้ยังไม่ reveal
    gsap.from(section.querySelector(".back-to-top"), {
      opacity: 0,
      y: REVEAL.y,
      duration: REVEAL.duration,
      ease: EASE,
      delay: 0.8,
      scrollTrigger: { trigger: ending, start: "top 80%", once: true },
    });
  });

  return (
    <SceneShell ref={ref} meta={meta} className="scene--ending">
      <div className="ending">
        <p className="scene-number" aria-hidden="true">
          {meta.number}
        </p>
        <h2 id={`${meta.id}-title`} className="ending__question">
          {ending.question}
        </h2>
        <ol className="ending__topics">
          {ending.topics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ol>
        <BackToTop label={ending.backToTop} targetId="scene-01-title" />
      </div>
    </SceneShell>
  );
}
