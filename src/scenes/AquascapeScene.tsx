import ImageSequence, { type SequenceBuildContext } from "../components/ImageSequence";
import SceneShell, { SceneHeading } from "../components/SceneShell";
import { aquascape, sceneMeta, type TankZone } from "../data/scenes";
import { sequences } from "../data/sequences";

const meta = sceneMeta[6];

/** กรอบโซนบนเฟรมสุดท้ายของ SEQ-3 (พิกัด px ของเฟรม 1190×666) — มองจากด้านหน้า: หลังตู้ = แถบบน, หน้าตู้ = แถบล่าง */
const ZONE_RECTS: Record<TankZone["id"], { x: number; y: number; w: number; h: number }> = {
  back: { x: 560, y: 216, w: 620, h: 104 },
  middle: { x: 560, y: 324, w: 620, h: 104 },
  front: { x: 560, y: 432, w: 620, h: 66 },
};

/**
 * ช่วง scroll (SEQ-3-aquascape.md)
 * - หัวข้อ + บทนำ: reveal 2–14% · ออก 26–30%
 * - หลังตู้ 32–50% · กลางตู้ 52–68% · หน้าตู้ 72–84% — กรอบเส้นประบนภาพไฮไลต์คู่กับข้อความที่ active
 * - หลักเกณฑ์: stagger 86–96% ค้างไว้จนจบฉาก
 */
const ZONE_TIMING: Record<TankZone["id"], [number, number]> = {
  back: [0.32, 0.5],
  middle: [0.52, 0.68],
  front: [0.72, 0.84],
};

function buildAquascapeTimeline(tl: gsap.core.Timeline, _ctx: SequenceBuildContext) {
  tl.from('[data-step="intro"] > *', { opacity: 0, y: 24, duration: 0.06, stagger: 0.03 }, 0.02);
  tl.to('[data-step="intro"]', { opacity: 0, y: -24, duration: 0.04 }, 0.26);

  aquascape.zones.forEach(({ id }) => {
    const [start, end] = ZONE_TIMING[id];
    tl.fromTo(`[data-step="${id}"]`, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.04 }, start);
    tl.fromTo(`#zone-rect-${id}`, { opacity: 0 }, { opacity: 1, duration: 0.03 }, start);
    tl.to(`[data-step="${id}"]`, { opacity: 0, y: -24, duration: 0.02 }, end);
    tl.to(`#zone-rect-${id}`, { opacity: 0, duration: 0.02 }, end);
  });

  tl.fromTo('[data-step="rules"]', { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0.86);
  tl.from(".rules__title, .rules__list li", { opacity: 0, y: 16, duration: 0.03, stagger: 0.012 }, 0.86);
}

/** ฉาก 07 — SEQ-3 ตู้ว่าง → ปูพื้น → หลัง → กลาง → หน้า · ข้อความคอลัมน์ซ้าย */
export default function AquascapeScene() {
  return (
    <SceneShell
      meta={meta}
      className="scene--sequence scene--aquascape"
      backdrop={
        <ImageSequence config={sequences.aquascape} alt={aquascape.alt} build={buildAquascapeTimeline}>
          <svg className="zone-overlay" viewBox="0 0 1190 666" aria-hidden="true">
            {aquascape.zones.map((zone) => {
              const r = ZONE_RECTS[zone.id];
              return (
                <g key={zone.id} id={`zone-rect-${zone.id}`} className="zone-rect">
                  <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={8} />
                  {/* ชื่อโซนกึ่งกลางกรอบ — มือถือ crop เฟรมเหลือช่วง x ≈ 50–76% */}
                  <text x={r.x + r.w / 2} y={r.y + 28} textAnchor="middle">
                    {zone.title}
                  </text>
                </g>
              );
            })}
          </svg>
        </ImageSequence>
      }
    >
      <div className="seq-copy aqua-copy">
        <div className="seq-copy__step" data-step="intro">
          <SceneHeading meta={meta} title={aquascape.title} />
          <p className="scene-lead">{aquascape.intro}</p>
        </div>
        {aquascape.zones.map((zone) => (
          <div key={zone.id} className="seq-copy__step zone-item" data-step={zone.id}>
            <h3 className="zone-item__title">{zone.title}</h3>
            <p className="zone-item__body">{zone.body}</p>
            <p className="zone-item__examples">
              {zone.examplesLead} {zone.examples}
            </p>
          </div>
        ))}
        <div className="seq-copy__step rules" data-step="rules">
          <h3 className="rules__title">{aquascape.rulesTitle}</h3>
          <ol className="rules__list">
            {aquascape.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </div>
      </div>
    </SceneShell>
  );
}
