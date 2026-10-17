import { useState, type CSSProperties, type ReactNode } from "react";

/** ตำแหน่งเป็น % ของภาพ (0–100) */
export interface Point {
  x: number;
  y: number;
}

export interface Annotation {
  id: string;
  /** เลขที่แสดงบนจุด (มือถือแสดงเฉพาะเลขนี้ + คำอธิบายด้านล่างภาพ) */
  number: number;
  /** จุดบนภาพที่ชี้ */
  anchor: Point;
  /** ปลายเส้นชี้ = มุม/ขอบของป้ายที่แตะเส้น */
  label: Point;
  /** ป้ายวางชิดซ้าย/กึ่งกลาง/ชิดขวาของปลายเส้น */
  align: "start" | "center" | "end";
  /** ป้ายอยู่เหนือ/ใต้/กึ่งกลางแนวตั้งของปลายเส้น */
  place: "above" | "below" | "middle";
  content: ReactNode;
}

export interface Guide {
  /** เส้นแนวนอนที่ y% ของภาพ เช่น ระดับผิวน้ำ */
  y: number;
  label: string;
}

interface AnnotatedPhotoProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  annotations: Annotation[];
  guide?: Guide;
  /** แสดงแทนเมื่อภาพโหลดไม่ได้ (เช่น SVG ไดอะแกรมเดิม) */
  fallback: ReactNode;
  className?: string;
}

/**
 * ภาพจริงพร้อมป้าย HTML ชี้ตำแหน่งบนภาพ
 * - .annotated__frame มีสัดส่วนเท่าภาพเสมอ จุด/เส้น/ป้ายใช้ % ของ frame จึงตรงกับภาพทุกขนาดจอ
 * - กล่องนอก (.annotated) กำหนดสัดส่วนเองได้ (มือถือ 3:2) → frame ล้นแล้วถูกตัดซ้าย-ขวาเท่ากัน = cover โฟกัส x 50%
 * - ป้ายซ้ำกับรายการด้านล่างภาพ จึงซ่อนจาก screen reader (ภาพมี alt อธิบายแล้ว)
 */
export default function AnnotatedPhoto({ src, alt, width, height, annotations, guide, fallback, className = "" }: AnnotatedPhotoProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;

  return (
    <figure className={`annotated ${className}`} style={{ "--photo-ratio": `${width} / ${height}` } as CSSProperties}>
      <div className="annotated__frame">
        <img className="annotated__img" src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" onError={() => setFailed(true)} />

        <div className="annotated__overlay" aria-hidden="true">
          {guide && (
            <div className="annotated__guide" style={{ top: `${guide.y}%` }}>
              <span className="annotated__guide-label">{guide.label}</span>
            </div>
          )}

          {/* เส้นชี้: viewBox 0–100 ยืดตาม frame + non-scaling-stroke ให้เส้นหนาเท่ากันทุกทิศ */}
          <svg className="annotated__leaders" viewBox="0 0 100 100" preserveAspectRatio="none">
            {annotations.map((a) => (
              <line
                key={a.id}
                className="annotated__leader"
                data-annotation={a.id}
                x1={a.anchor.x}
                y1={a.anchor.y}
                x2={a.label.x}
                y2={a.label.y}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {annotations.map((a) => (
            <div key={a.id} className="annotated__item" data-annotation={a.id}>
              <span className="annotated__dot" style={{ left: `${a.anchor.x}%`, top: `${a.anchor.y}%` }}>
                {a.number}
              </span>
              <div
                className={`annotated__label annotated__label--${a.align} annotated__label--${a.place}`}
                style={{ left: `${a.label.x}%`, top: `${a.label.y}%` }}
              >
                {/* กล่องด้านในแยกจากตัวจัดตำแหน่ง — animation ใช้ transform ของกล่องได้โดยไม่ทับการจัดวาง */}
                <div className="annotated__box">{a.content}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}
