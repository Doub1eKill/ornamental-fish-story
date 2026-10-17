import { useRef } from "react";
import CardRail from "../components/CardRail";
import FishPhoto from "../components/FishPhoto";
import SceneShell, { SceneHeading } from "../components/SceneShell";
import { sceneMeta, tropical } from "../data/scenes";
import { gsap } from "../lib/gsap";
import { SCRUB, revealHeading, revealList, useSceneMotion } from "../lib/motion";

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
    return;
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
  gsap.to(track, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => `+=${distance()}`,
      pin: true,
      scrub: SCRUB,
      invalidateOnRefresh: true,
      // การ์ด active ตาม progress (ใบสุดท้ายชิดขวา ไม่เคยผ่านกึ่งกลางจอ จึงไม่ใช้ตำแหน่งการ์ด)
      onUpdate: (self) => {
        const index = Math.round(self.progress * (cards.length - 1));
        if (index !== current) setActive((current = index));
      },
    },
  });

  return () => {
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
