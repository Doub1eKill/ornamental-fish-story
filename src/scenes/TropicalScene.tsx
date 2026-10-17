import { useRef } from "react";
import CardRail from "../components/CardRail";
import FishPhoto from "../components/FishPhoto";
import SceneShell, { SceneHeading } from "../components/SceneShell";
import { sceneMeta, tropical } from "../data/scenes";
import { gsap } from "../lib/gsap";
import { revealHeading, revealList, useSceneMotion } from "../lib/motion";
import { addSnapPoints, pointsOnTrigger } from "../lib/scrollAssist";

/**
 * หน่วงการ์ดปลา (scroll assist)
 * - HOLD: ช่วงพักก่อนการ์ดเริ่มเลื่อน และหลังใบสุดท้ายมาถึง (สัดส่วนของระยะเลื่อนการ์ด)
 * - DAMP: ต้องเลื่อนนานกว่าระยะการ์ดจริงกี่เท่า → การ์ดไปช้าลง อ่านทันขึ้น
 * - RAIL_SCRUB: การ์ดตาม scroll แบบมีน้ำหนัก (ค่ามาก = หน่วงมาก)
 * - แต่ละใบมีจุดหยุด: ปล่อยมือแล้วการ์ดใบที่ใกล้ที่สุดเลื่อนเข้าตำแหน่งเอง
 */
const HOLD = 0.12;
const DAMP = 1.6;
const RAIL_SCRUB = 1.1;

const meta = sceneMeta[3];

/**
 * desktop/tablet: pin ฉาก แล้วเลื่อนการ์ด 8 ใบแนวนอนตาม scroll (scrub) · การ์ด active ขยาย 1.04 · ตัวนับ 1/8
 * มือถือ: ไม่ pin — การ์ดเรียงแนวตั้ง reveal ทีละใบ · reduced motion: grid นิ่ง
 */
function buildRail(section: HTMLElement, isMobile: boolean) {
  revealHeading(section);
  const cards = gsap.utils.toArray<HTMLElement>(".fish-card", section);

  if (isMobile) {
    revealList(cards, section, true);
    // มือถือ: ช่วยหยุดให้การ์ดแต่ละใบอยู่กลางจอ
    return addSnapPoints(() =>
      cards.map((card) => {
        const r = card.getBoundingClientRect();
        return r.top + window.scrollY - Math.max(0, (window.innerHeight - r.height) / 2);
      }),
    );
  }

  const rail = section.querySelector<HTMLElement>(".card-rail")!;
  const track = section.querySelector<HTMLElement>(".card-rail__track")!;
  const progress = section.querySelector<HTMLElement>(".card-rail__progress")!;
  section.classList.add("is-rail");

  const distance = () => Math.max(0, track.scrollWidth - rail.clientWidth);
  const setActive = (index: number) => {
    cards.forEach((card, i) => card.classList.toggle("is-active", i === index));
    progress.textContent = `${index + 1} / ${cards.length}`;
  };
  setActive(0);

  let current = 0;
  const total = 1 + HOLD * 2;
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      // ระยะ pin = ระยะการ์ดจริง × DAMP + ช่วงพักหัว/ท้าย
      end: () => `+=${distance() * DAMP * total}`,
      pin: true,
      scrub: RAIL_SCRUB,
      invalidateOnRefresh: true,
      // การ์ด active ตามระยะที่การ์ดเลื่อนไปแล้ว (ไม่นับช่วงพัก)
      onUpdate: (self) => {
        const railProgress = gsap.utils.clamp(0, 1, (self.progress * total - HOLD) / 1);
        const index = Math.round(railProgress * (cards.length - 1));
        if (index !== current) setActive((current = index));
      },
    },
  });
  tl.to(track, { x: () => -distance(), duration: 1 }, HOLD);
  tl.to({}, { duration: HOLD }); // พักท้ายให้ใบสุดท้ายค้างก่อนปล่อย pin

  // จุดหยุดทีละใบ (progress ของ timeline ที่การ์ดใบ i อยู่ตำแหน่ง active พอดี)
  const cardStops = cards.map((_, i) => (HOLD + i / (cards.length - 1)) / total);
  const removeSnap = addSnapPoints(pointsOnTrigger(tl.scrollTrigger!, [0, ...cardStops, 1]));

  return () => {
    removeSnap();
    section.classList.remove("is-rail");
    cards.forEach((card) => card.classList.remove("is-active"));
    progress.textContent = "";
  };
}

export default function TropicalScene() {
  const ref = useRef<HTMLElement>(null);
  useSceneMotion(ref, (section, { isMobile }) => buildRail(section, isMobile));

  return (
    <SceneShell ref={ref} meta={meta} className="scene--tropical">
      <SceneHeading meta={meta} title={tropical.title} subtitle={tropical.subtitle} />
      <CardRail label={tropical.subtitle}>
        {tropical.groups.map((group) => (
          <li key={group.id} className="fish-card">
            <FishPhoto className="fish-card__image" photo={group.photo} fallback={{ src: group.image, alt: group.alt }} />
            <h3 className="fish-card__title">{group.title}</h3>
            {group.points.length > 0 && (
              <ul className="fish-card__points">
                {group.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            )}
            <p className="fish-card__examples">
              <span className="examples-label">{tropical.examplesLabel}:</span> {group.examples}
            </p>
          </li>
        ))}
      </CardRail>
    </SceneShell>
  );
}
