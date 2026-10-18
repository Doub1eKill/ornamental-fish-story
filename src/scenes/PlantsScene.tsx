import { useRef } from "react";
import AnnotatedPhoto, { type Annotation } from "../components/AnnotatedPhoto";
import LabeledDiagram from "../components/LabeledDiagram";
import SceneShell, { SceneHeading } from "../components/SceneShell";
import { plants, sceneMeta, type PlantType } from "../data/scenes";
import { gsap } from "../lib/gsap";
import { EASE, REVEAL, reveal, useSceneMotion } from "../lib/motion";
import plantLevelsSvg from "../assets/svg/diagram-plant-levels.svg?raw";

const meta = sceneMeta[5];

/** ระดับผิวน้ำในภาพจริง (% จากบน) — วัดจาก design/plant-levels/plant-levels.jpg */
const WATERLINE_Y = 49.2;

/** ตำแหน่งจุด/ป้ายบนภาพจริง (% ของภาพ) — วัดจากภาพ: ใบพืชริมตลิ่ง, ดอกบัว, พุ่มสาหร่ายใต้น้ำ, กอพืชที่ผิวน้ำ */
const LAYOUT: Record<PlantType["id"], Pick<Annotation, "anchor" | "label" | "align" | "place">> = {
  marginal: { anchor: { x: 21, y: 31 }, label: { x: 14, y: 21 }, align: "center", place: "above" },
  emerged: { anchor: { x: 45, y: 35.5 }, label: { x: 45, y: 22 }, align: "center", place: "above" },
  submerged: { anchor: { x: 63, y: 68 }, label: { x: 76, y: 70 }, align: "start", place: "middle" },
  floating: { anchor: { x: 88, y: 45 }, label: { x: 84, y: 33 }, align: "center", place: "above" },
};

// ชื่อไทยไม่รวมเลขนำหน้า ("1. พืชชายน้ำ" → "พืชชายน้ำ") เพราะเลขแสดงบนจุดแล้ว
const annotations: Annotation[] = plants.types.map((type, index) => ({
  id: type.id,
  number: index + 1,
  ...LAYOUT[type.id],
  content: (
    <>
      <span className="annotated__title">{type.title.replace(/^\d+\.\s*/, "")}</span>
      <span className="annotated__en">{type.en}</span>
      <span className="annotated__examples">{type.examples.map((ex) => ex.name).join(" · ")}</span>
    </>
  ),
}));

/**
 * เส้นระดับผิวน้ำวาดซ้าย→ขวา แล้วป้ายโผล่ทีละประเภท 1→4 (จุด → เส้นชี้ → ป้าย)
 * มือถือ: แสดงเฉพาะจุดตัวเลข (ป้ายซ่อนด้วย CSS — คำอธิบายอยู่ในการ์ดด้านล่าง)
 */
function buildDiagram(figure: Element, isMobile: boolean) {
  const tl = gsap.timeline({ defaults: { ease: EASE }, scrollTrigger: { trigger: figure, start: "top 75%", once: true } });
  // ภาพค่อยๆ ปรากฏ (fade + scale) แทนการโผล่มาโดนตัดตรงรอยต่อฉาก — tween ที่ <img> (กรอบใช้ transform จัดกึ่งกลาง)
  tl.from(figure.querySelector(".annotated__img"), { opacity: 0, scale: 0.97, duration: 0.8 }, 0);
  tl.from(figure.querySelector(".annotated__guide"), { scaleX: 0, transformOrigin: "left center", duration: 1, ease: "power1.inOut" }, 0.2);
  annotations.forEach(({ id, anchor, label }, index) => {
    const at = 0.5 + index * 0.35;
    const item = `[data-annotation="${id}"]`;
    tl.from(figure.querySelector(`${item} .annotated__dot`), { scale: 0, opacity: 0, duration: 0.35 }, at);
    if (isMobile) return;
    // เส้นชี้ยืดจากจุดออกไปหาป้าย (tween ปลายเส้น — เส้นเต็มไม่ใช้ dash)
    tl.fromTo(
      figure.querySelector(`line${item}`),
      { attr: { x2: anchor.x, y2: anchor.y } },
      { attr: { x2: label.x, y2: label.y }, duration: 0.3 },
      at + 0.1,
    );
    tl.from(figure.querySelector(`${item} .annotated__box`), { opacity: 0, y: REVEAL.y / 2, duration: 0.45 }, at + 0.25);
  });
}

export default function PlantsScene() {
  const ref = useRef<HTMLElement>(null);

  // scene-06-fg parallax อยู่ใน useSceneMotion
  useSceneMotion(ref, (section, { isMobile }) => {
    reveal([section.querySelector(".scene-heading")!, section.querySelector(".scene-lead")!], section);
    const figure = section.querySelector(".plants-photo");
    if (figure) buildDiagram(figure, isMobile);
    reveal(section.querySelectorAll(".plant-card"), section.querySelector(".plant-list")!);
  });

  return (
    <SceneShell ref={ref} meta={meta} className="scene--plants">
      <SceneHeading meta={meta} title={plants.title} />
      <p className="scene-lead">{plants.definition}</p>
      <AnnotatedPhoto
        className="plants-photo"
        src={plants.photo.src}
        width={plants.photo.width}
        height={plants.photo.height}
        alt={plants.diagramAlt}
        annotations={annotations}
        guide={{ y: WATERLINE_Y, label: plants.waterlineLabel }}
        fallback={<LabeledDiagram svg={plantLevelsSvg} alt={plants.diagramAlt} className="plants-diagram" />}
      />
      <ol className="plant-list">
        {plants.types.map((type) => (
          <li key={type.id} className="plant-card" data-type={type.id}>
            <h3 className="plant-card__title">
              {type.title} <span className="plant-card__en" lang="en">({type.en})</span>
            </h3>
            <p>{type.body}</p>
            <p className="plant-card__examples">
              <span className="examples-label">{plants.examplesLabel}:</span>
              {type.examples.map((ex) => (
                <span key={ex.name}>
                  {" "}
                  {ex.name}
                  {ex.scientific && (
                    <>
                      {" ("}
                      <i lang="la">{ex.scientific}</i>
                      {")"}
                    </>
                  )}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ol>
    </SceneShell>
  );
}
