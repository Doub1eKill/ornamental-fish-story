import type { ReactNode, Ref } from "react";
import type { SceneMeta } from "../data/scenes";

interface SceneShellProps {
  meta: SceneMeta;
  className?: string;
  /** แทนที่พื้นหลังมาตรฐาน (bg + fg จาก meta) เช่น <ImageSequence> */
  backdrop?: ReactNode;
  ref?: Ref<HTMLElement>;
  children: ReactNode;
}

/** <section> ของทุกฉาก: พื้นหลัง + เนื้อหา · หัวข้อฉากต้องมี id = `${meta.id}-title` */
export default function SceneShell({ meta, className = "", backdrop, ref, children }: SceneShellProps) {
  return (
    <section
      ref={ref}
      id={meta.id}
      className={`scene scene--depth-${meta.depth} ${className}`}
      aria-labelledby={`${meta.id}-title`}
      data-scene={meta.number}
    >
      {/* พื้นหลังมาตรฐานเป็นภาพตกแต่ง (alt ว่าง) · backdrop ที่ส่งมาเองกำหนด alt ของตัวเอง */}
      <div className="scene__backdrop">
        {backdrop ?? (
          <>
            <img className="scene__bg" src={meta.bg} alt="" loading="lazy" decoding="async" />
            {meta.fg && <img className="scene__fg" src={meta.fg} alt="" loading="lazy" decoding="async" />}
          </>
        )}
      </div>
      <div className="scene__inner">{children}</div>
    </section>
  );
}

export function SceneHeading({
  meta,
  eyebrow,
  title,
  subtitle,
}: {
  meta: SceneMeta;
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="scene-heading">
      <p className="scene-number" aria-hidden="true">
        {meta.number}
        {eyebrow && <span className="eyebrow scene-heading__eyebrow"> · {eyebrow}</span>}
      </p>
      <h2 id={`${meta.id}-title`} className="scene-heading__title">
        {title}
      </h2>
      {subtitle && <p className="scene-heading__subtitle">{subtitle}</p>}
    </header>
  );
}
