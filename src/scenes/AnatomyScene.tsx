import ImageSequence, { type SequenceBuildContext } from "../components/ImageSequence";
import InlineSvg from "../components/InlineSvg";
import SceneShell, { SceneHeading } from "../components/SceneShell";
import { anatomy, sceneMeta } from "../data/scenes";
import { sequences } from "../data/sequences";
import anatomySvg from "../assets/svg/fish-anatomy.svg?raw";

const meta = sceneMeta[2];

const GOLD = "#F2913D"; // --accent-gold: จุดที่ active
const CREAM = "#F4EFE3"; // --text: จุดที่ผ่านแล้ว

/**
 * ช่วง scroll (ปรับจาก SEQ-2-anatomy.md ให้ตรงคลิปจริง: ปลานิ่งตั้งแต่ ~50%)
 * - หัวข้อ: เข้า 0–8% อยู่ตลอดฉาก
 * - label 1–9: เริ่มที่ 52% ห่างกัน 5% (52, 57, … 92%) แต่ละจุด: จุด → เส้นชี้วาดด้วย stroke-dashoffset → ข้อความ fade
 * - มือถือ: ข้อความใน SVG ซ่อน แสดงเป็นชิปทีละอันใต้ปลา (จุดบนตัวปลายังขึ้นครบ)
 */
const LABEL_START = 0.52;
const LABEL_GAP = 0.05;

function buildAnatomyTimeline(tl: gsap.core.Timeline, { isMobile, section }: SequenceBuildContext) {
  tl.from(".scene-heading", { opacity: 0, y: 24, duration: 0.08 }, 0);

  anatomy.labels.forEach(({ id }, index) => {
    const at = LABEL_START + index * LABEL_GAP;
    const leader = section.querySelector<SVGLineElement>(`#leader-${id}`);
    const length = leader ? leader.getTotalLength() : 0;

    tl.fromTo(`#dot-${id}`, { opacity: 0, scale: 0, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, fill: GOLD, duration: 0.01 }, at);
    if (!isMobile) {
      tl.fromTo(`#leader-${id}`, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 0.02 }, at + 0.005);
      tl.fromTo(`#text-${id}`, { opacity: 0 }, { opacity: 1, duration: 0.015 }, at + 0.02);
    }
    // จุดก่อนหน้ากลายเป็นสีครีมเมื่อจุดถัดไป active
    if (index < anatomy.labels.length - 1) tl.to(`#dot-${id}`, { fill: CREAM, duration: 0.01 }, at + LABEL_GAP);

    if (isMobile) {
      const chip = `.anatomy-chip[data-label="${id}"]`;
      tl.fromTo(chip, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.015 }, at);
      if (index < anatomy.labels.length - 1) tl.to(chip, { opacity: 0, y: -12, duration: 0.015 }, at + LABEL_GAP - 0.015);
    }
  });
}

/** ฉาก 03 — SEQ-2 + label 9 จุดซ้อนบนเฟรม (พิกัดใน fish-anatomy.svg วัดจากเฟรมสุดท้าย) */
export default function AnatomyScene() {
  return (
    <SceneShell
      meta={meta}
      className="scene--sequence scene--anatomy"
      backdrop={
        <ImageSequence config={sequences.anatomy} alt={anatomy.alt} build={buildAnatomyTimeline}>
          <InlineSvg svg={anatomySvg} className="anatomy-overlay" />
        </ImageSequence>
      }
    >
      <SceneHeading meta={meta} eyebrow={anatomy.eyebrow} title={anatomy.title} />
      {/* desktop: ให้ screen reader อ่าน (label ใน SVG ซ่อนจาก AT) · มือถือ: ชิปทีละอัน */}
      <ol className="anatomy-chips">
        {anatomy.labels.map((label, index) => (
          <li key={label.id} className="anatomy-chip" data-label={label.id}>
            <span className="anatomy-chip__index" aria-hidden="true">
              {index + 1}
            </span>
            {label.text} <span lang="en">({label.en})</span>
          </li>
        ))}
      </ol>
    </SceneShell>
  );
}
