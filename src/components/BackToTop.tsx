import { ArrowUp } from "lucide-react";
import { prefersReducedMotion } from "../lib/media";

export default function BackToTop({ label, targetId }: { label: string; targetId: string }) {
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    // ย้าย focus กลับไปที่หัวเรื่องฉากแรก ให้ผู้ใช้คีย์บอร์ดเริ่มใหม่จากด้านบน
    document.getElementById(targetId)?.focus({ preventScroll: true });
  };

  return (
    <button type="button" className="back-to-top" onClick={handleClick}>
      <ArrowUp size={20} strokeWidth={1.5} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
