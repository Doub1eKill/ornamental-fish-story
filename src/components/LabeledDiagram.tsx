import type { ReactNode } from "react";
import InlineSvg from "./InlineSvg";

interface LabeledDiagramProps {
  svg: string;
  alt: string;
  className?: string;
  /** รายการที่ screen reader อ่านแทน label ใน SVG และแสดงบนมือถือเมื่อ label ใน SVG เล็กเกินไป */
  children?: ReactNode;
}

/**
 * Diagram แบบ inline SVG ที่มี label กลุ่ม `.diagram-label` / `.anatomy-label` (เรียงตาม data-order)
 * Phase 3: label จะ reveal ตาม data-order เมื่อเลื่อนเข้าฉาก
 */
export default function LabeledDiagram({ svg, alt, className = "", children }: LabeledDiagramProps) {
  return (
    <figure className={`labeled-diagram ${className}`}>
      <InlineSvg svg={svg} alt={alt} className="labeled-diagram__svg" />
      {children}
    </figure>
  );
}
