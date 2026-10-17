import { useState } from "react";
import type { FishImage } from "../data/scenes";

interface FishPhotoProps {
  photo: FishImage;
  /** ภาพประกอบ SVG เดิม — แสดงแทนเมื่อภาพถ่ายโหลดไม่ได้ */
  fallback: FishImage;
  className?: string;
}

/**
 * ภาพถ่ายปลา 16:9 ขอบจางเข้ากับพื้น (mask ใน CSS) · lazy load
 * ถ้าโหลดไม่ได้ สลับเป็น SVG ภาพประกอบ (แสดงแบบ contain ไม่ครอป)
 */
export default function FishPhoto({ photo, fallback, className = "" }: FishPhotoProps) {
  const [failed, setFailed] = useState(false);
  const image = failed ? fallback : photo;

  return (
    <div className={`fish-photo ${failed ? "fish-photo--fallback" : ""} ${className}`}>
      <img
        key={image.src}
        src={image.src}
        alt={image.alt}
        width={failed ? 400 : 800}
        height={failed ? 240 : 446}
        loading="lazy"
        decoding="async"
        onError={failed ? undefined : () => setFailed(true)}
      />
    </div>
  );
}
