import { useRef } from "react";
import SceneShell, { SceneHeading } from "../components/SceneShell";
import { sceneMeta, traits } from "../data/scenes";
import { revealHeading, revealList, useSceneMotion } from "../lib/motion";

const meta = sceneMeta[1];

export default function TraitsScene() {
  const ref = useRef<HTMLElement>(null);

  // หัวข้อ fade-up · 9 ข้อ stagger 0.08s (desktop grid เข้าพร้อมกัน, มือถือทีละข้อเมื่อเข้าจอ)
  useSceneMotion(ref, (section, { isMobile }) => {
    revealHeading(section);
    revealList(section.querySelectorAll(".trait-card"), section.querySelector(".trait-grid")!, isMobile);
  });

  return (
    <SceneShell ref={ref} meta={meta} className="scene--traits">
      <SceneHeading meta={meta} title={traits.title} />
      <ol className="trait-grid">
        {traits.items.map((item, index) => (
          <li key={item} className="trait-card">
            <span className="trait-card__index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p>{item}</p>
          </li>
        ))}
      </ol>
    </SceneShell>
  );
}
