import type { ReactNode } from "react";

interface CardRailProps {
  label: string;
  children: ReactNode;
}

/**
 * แถวการ์ด — ไม่มี JS / reduced motion / มือถือ เป็น grid ธรรมดา
 * จอ ≥ 768px + motion: ฉากที่ใช้ใส่ class `is-rail` แล้ว pin + เลื่อนแนวนอนตาม scroll (ดู TropicalScene)
 */
export default function CardRail({ label, children }: CardRailProps) {
  return (
    <div className="card-rail" role="region" aria-label={label}>
      <ol className="card-rail__track">{children}</ol>
      <p className="card-rail__progress" aria-hidden="true" />
    </div>
  );
}
