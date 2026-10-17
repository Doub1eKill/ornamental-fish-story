// config ของ image sequence ทุกชุด — ไฟล์เดียว
// เพิ่มเฟรม 9:16 ภายหลัง: แตกเฟรมไปโฟลเดอร์ใหม่ แล้วเพิ่ม source ที่มี `media` (เช่น "(max-aspect-ratio: 3/4)")
// ไว้ "ก่อน" source หลัก — <ImageSequence> เลือก source แรกที่ media ตรง
// เฟรมทุกชุดแตกด้วย scripts/extract-frames.sh (ครอปลายน้ำ → 1190×666)
import { BASE } from "../lib/asset";

export interface Focal {
  /** 0–1 จุดที่ต้องเห็นเสมอ (0.5 = กึ่งกลาง) */
  x: number;
  y: number;
}

/** cover = เต็มจอ ตัดส่วนเกินตาม focal · contain = เห็นทั้งเฟรม พื้นที่ว่างเติมด้วยภาพเบลอ */
export type Fit = "cover" | "contain";

export interface SequenceSource {
  /** media query ที่ source นี้ใช้ — ไม่ระบุ = ค่าเริ่มต้น (ต้องอยู่ท้ายสุด) */
  media?: string;
  /** โฟลเดอร์ใน public/ ไฟล์ชื่อ 0001.webp … */
  path: string;
  frameCount: number;
  width: number;
  height: number;
  focal: { desktop: Focal; mobile: Focal };
  fit: { desktop: Fit; mobile: Fit };
  /** สีพื้นเมื่อ fit = contain (ใต้ภาพเบลอ และระหว่างโหลด) */
  fill: string;
}

export interface SequenceConfig {
  id: string;
  /** ระยะ scroll ระหว่าง pin หน่วย vh (ตาม SEQ-*.md) */
  pinVh: number;
  scrub: number;
  sources: SequenceSource[];
}

export const frameUrl = (source: SequenceSource, index: number) =>
  `${source.path}/${String(index + 1).padStart(4, "0")}.webp`;

export const pickSource = (config: SequenceConfig): SequenceSource =>
  config.sources.find((s) => !s.media || window.matchMedia(s.media).matches) ?? config.sources[config.sources.length - 1];

const FRAME = { width: 1190, height: 666 };

export const sequences = {
  hero: {
    id: "seq-1-hero",
    pinVh: 300,
    scrub: 0.6,
    sources: [
      {
        path: `${BASE}sequences/seq-1-hero`,
        frameCount: 192, // 0–8.0s @24fps
        ...FRAME,
        // ปลากัดอยู่ครึ่งขวาของเฟรม (x ≈ 70%)
        focal: { desktop: { x: 0.5, y: 0.5 }, mobile: { x: 0.7, y: 0.5 } },
        fit: { desktop: "cover", mobile: "cover" },
        fill: "#0f3e55",
      },
    ],
  },
  anatomy: {
    id: "seq-2-anatomy",
    pinVh: 250,
    scrub: 0.6,
    sources: [
      {
        path: `${BASE}sequences/seq-2-anatomy`,
        frameCount: 192, // 0–8.0s @24fps · ปลานิ่งตั้งแต่เฟรม ~96 (50%)
        ...FRAME,
        focal: { desktop: { x: 0.5, y: 0.5 }, mobile: { x: 0.5, y: 0.5 } },
        // contain: label 9 จุดต้องอยู่บนจอครบทุกสัดส่วนจอ · มือถือได้ปลาเต็มกว้างที่ y ≈ 38–62% ตาม safe area
        fit: { desktop: "contain", mobile: "contain" },
        fill: "#0c2a3f",
      },
    ],
  },
  aquascape: {
    id: "seq-3-aquascape",
    pinVh: 280,
    scrub: 0.6,
    sources: [
      {
        path: `${BASE}sequences/seq-3-aquascape`,
        frameCount: 154, // ใช้เฉพาะ 0–6.4s — หลังจากนั้นพืชยุบหายผิดธรรมชาติ
        ...FRAME,
        // ตัวตู้อยู่ x ≈ 46–100% ของเฟรม
        focal: { desktop: { x: 0.5, y: 0.5 }, mobile: { x: 0.68, y: 0.5 } },
        fit: { desktop: "cover", mobile: "cover" },
        fill: "#0b1a2e",
      },
    ],
  },
} satisfies Record<string, SequenceConfig>;
