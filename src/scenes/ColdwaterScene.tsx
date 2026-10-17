import { useRef } from "react";
import FishPhoto from "../components/FishPhoto";
import SceneShell, { SceneHeading } from "../components/SceneShell";
import { coldwater, sceneMeta } from "../data/scenes";
import { gsap } from "../lib/gsap";
import { SCRUB, reveal, revealHeading, useSceneMotion } from "../lib/motion";

const meta = sceneMeta[4];

/** ความเร็ว parallax ของปลาแต่ละตัว (motion-notes: ปลาทอง 0.4 / แฟนซีคาร์ป 0.6) */
const PARALLAX_PX: Record<string, number> = { goldfish: 32, "fancy-carp": 48 };

export default function ColdwaterScene() {
  const ref = useRef<HTMLElement>(null);

  useSceneMotion(ref, (section) => {
    revealHeading(section);
    // ปลาทั้งสองตัวอยู่ใน timeline เดียว (ScrollTrigger เดียว) คนละระยะ
    const drift = gsap.timeline({
      defaults: { ease: "none", duration: 1 },
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: SCRUB },
    });
    section.querySelectorAll<HTMLElement>(".cold-fish").forEach((fish) => {
      const px = PARALLAX_PX[fish.dataset.fish ?? ""] ?? PARALLAX_PX.goldfish;
      // parallax ที่กรอบภาพ (ไม่ใช่ <img>) — <img> ใช้ transform สำหรับ hover scale
      drift.fromTo(fish.querySelector(".fish-photo"), { y: px }, { y: -px }, 0);
      reveal(fish.querySelector("figcaption")!, fish);
    });
  });

  return (
    <SceneShell ref={ref} meta={meta} className="scene--cold">
      <SceneHeading meta={meta} title={coldwater.title} />
      <div className="cold-grid">
        {coldwater.fish.map((fish) => (
          <figure key={fish.id} className="cold-fish" data-fish={fish.id}>
            <FishPhoto photo={fish.photo} fallback={{ src: fish.image, alt: fish.alt }} />
            <figcaption>
              <h3 className="cold-fish__name">{fish.name}</h3>
              {fish.body && <p>{fish.body}</p>}
            </figcaption>
          </figure>
        ))}
      </div>
    </SceneShell>
  );
}
