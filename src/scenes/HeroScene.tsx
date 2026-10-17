import ImageSequence from "../components/ImageSequence";
import SceneShell from "../components/SceneShell";
import ScrollPrompt from "../components/ScrollPrompt";
import { hero, sceneMeta } from "../data/scenes";
import { sequences } from "../data/sequences";

const meta = sceneMeta[0];

// แบ่งนิยามเป็นวลีตามช่องว่างในต้นฉบับ เพื่อ reveal ทีละวลี (ภาษาไทยตัดบรรทัดตามวลี)
const phrases = hero.definition.before.trim().split(" ");

/**
 * ข้อความซ้อนตามช่วง scroll (SEQ-1-hero.md) — ตำแหน่งบน timeline 0–1 = 0–100%
 * - ชื่อเรื่อง: แสดงทันทีตั้งแต่โหลด (ไม่ fade-in — h1 เป็น LCP ของหน้า) · ออก 26–32%
 * - ใช้ opacity ไม่ใช่ autoAlpha: ข้อความช่วงที่ยังไม่ถึงต้องยังอยู่ใน accessibility tree
 * - นิยาม: reveal ทีละวลี 34–46% · ออก 64–70%
 * - ผู้สอน: เข้า 74–82%
 * - scroll prompt: แสดงตอนเริ่ม จางออก 2–6% · กลับมาที่ 95%
 */
function buildHeroTimeline(tl: gsap.core.Timeline) {
  tl.to('[data-step="title"]', { opacity: 0, y: -24, duration: 0.06 }, 0.26);

  tl.fromTo('[data-step="definition"]', { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0.33);
  tl.from(".hero__phrase", { opacity: 0, y: 24, duration: 0.04, stagger: 0.08 / (phrases.length) }, 0.34);
  tl.to('[data-step="definition"]', { opacity: 0, y: -24, duration: 0.06 }, 0.64);

  tl.fromTo('[data-step="credit"]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.08 }, 0.74);

  tl.to(".scroll-prompt", { autoAlpha: 0, duration: 0.04 }, 0.02);
  tl.to(".scroll-prompt", { autoAlpha: 1, duration: 0.04 }, 0.95);
}

export default function HeroScene() {
  return (
    <SceneShell
      meta={meta}
      className="scene--sequence scene--hero"
      backdrop={
        <ImageSequence config={sequences.hero} alt={hero.sequenceAlt} build={buildHeroTimeline} priority />
      }
    >
      <div className="seq-copy">
        <div className="seq-copy__step" data-step="title">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1 id={`${meta.id}-title`} className="hero__title" tabIndex={-1}>
            {hero.title}
          </h1>
        </div>
        <p className="seq-copy__step hero__definition" data-step="definition">
          {phrases.map((phrase) => (
            <span key={phrase}>
              <span className="hero__phrase">{phrase}</span>{" "}
            </span>
          ))}
          <strong className="hero__phrase hl-gold">{hero.definition.highlight}</strong>
          {hero.definition.after}
        </p>
        <div className="seq-copy__step hero__credit" data-step="credit">
          <p className="hero__instructor">{hero.instructor}</p>
          <p className="hero__affiliation">{hero.affiliation}</p>
        </div>
      </div>
      <ScrollPrompt text={hero.scrollPrompt} href="#scene-02" />
    </SceneShell>
  );
}
