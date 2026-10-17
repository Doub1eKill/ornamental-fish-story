import { useRef } from "react";
import InlineSvg from "../components/InlineSvg";
import SceneShell, { SceneHeading } from "../components/SceneShell";
import { factors, sceneMeta, type Factor } from "../data/scenes";
import { gsap } from "../lib/gsap";
import { EASE, revealHeading, revealList, useSceneMotion } from "../lib/motion";
import iconLight from "../assets/svg/icon-light.svg?raw";
import iconTurbidity from "../assets/svg/icon-turbidity.svg?raw";
import iconPh from "../assets/svg/icon-ph.svg?raw";
import iconNitrogen from "../assets/svg/icon-nitrogen.svg?raw";
import iconPhosphorus from "../assets/svg/icon-phosphorus.svg?raw";

const meta = sceneMeta[7];

const icons: Record<Factor["id"], string> = {
  light: iconLight,
  turbidity: iconTurbidity,
  ph: iconPh,
  nitrogen: iconNitrogen,
  phosphorus: iconPhosphorus,
};

/** เน้นคำใน factors.phHighlight ด้วย --accent-betta */
function renderLine(line: string) {
  const at = line.indexOf(factors.phHighlight);
  if (at < 0) return line;
  return (
    <>
      {line.slice(0, at)}
      <strong className="hl-betta">{factors.phHighlight}</strong>
      {line.slice(at + factors.phHighlight.length)}
    </>
  );
}

function PhBar() {
  const { min, max, scaleMax } = factors.phRange;
  return (
    <div className="ph-bar" role="img" aria-label={factors.phBarAlt}>
      <div className="ph-bar__track">
        <div
          className="ph-bar__range"
          style={{ left: `${(min / scaleMax) * 100}%`, width: `${((max - min) / scaleMax) * 100}%` }}
        />
      </div>
      <div className="ph-bar__scale" aria-hidden="true">
        <span>0</span>
        <span>7</span>
        <span>14</span>
      </div>
    </div>
  );
}

export default function FactorsScene() {
  const ref = useRef<HTMLElement>(null);

  // การ์ด 5 ใบ stagger · แถบ pH เติมช่วง 6.5–7.4 (scaleX จากซ้าย) เมื่อการ์ด pH เข้าจอ
  useSceneMotion(ref, (section, { isMobile }) => {
    revealHeading(section);
    revealList(section.querySelectorAll(".factor-card"), section.querySelector(".factor-grid")!, isMobile);

    const range = section.querySelector(".ph-bar__range");
    if (range) {
      gsap.from(range, {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 0.9,
        ease: EASE,
        delay: 0.3,
        scrollTrigger: { trigger: range, start: "top 85%", once: true },
      });
    }
  });

  return (
    <SceneShell ref={ref} meta={meta} className="scene--factors">
      <SceneHeading meta={meta} title={factors.title} />
      <ol className="factor-grid">
        {factors.items.map((item) => (
          <li key={item.id} className="factor-card" data-factor={item.id}>
            <InlineSvg svg={icons[item.id]} className="factor-card__icon" />
            <h3 className="factor-card__title">{item.title}</h3>
            {item.lines.map((line) => (
              <p key={line}>{renderLine(line)}</p>
            ))}
            {item.id === "ph" && <PhBar />}
          </li>
        ))}
      </ol>
    </SceneShell>
  );
}
