import type { SequenceSource } from "../data/sequences";
import { frameUrl } from "../data/sequences";
import { MQ } from "./media";

const MAX_DPR = 2;
const CONCURRENCY = 6;
/** เฟรมหลักที่โหลดก่อน: ทุกๆ KEY_STEP เฟรม */
const KEY_STEP = 4;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** ตำแหน่งเฟรมในกล่อง cw×ch — ใช้ร่วมกันระหว่าง canvas และ overlay (label/กรอบโซน) ให้ตรงกันเสมอ */
export function fitRect(cw: number, ch: number, source: SequenceSource, mobile: boolean): Rect {
  const fit = mobile ? source.fit.mobile : source.fit.desktop;
  const focal = mobile ? source.focal.mobile : source.focal.desktop;
  const sx = cw / source.width;
  const sy = ch / source.height;
  const scale = fit === "cover" ? Math.max(sx, sy) : Math.min(sx, sy);
  const w = source.width * scale;
  const h = source.height * scale;
  // ส่วนที่ล้น/ที่ว่างแบ่งตาม focal: 0 ชิดซ้าย/บน, 0.5 กึ่งกลาง, 1 ชิดขวา/ล่าง
  return { x: (cw - w) * focal.x, y: (ch - h) * focal.y, w, h };
}

/** พื้นที่ว่างรอบเฟรมตอน fit = contain: พื้นหลังสีขอบเฟรม + gradient ไล่ขอบ (สร้างครั้งเดียวต่อขนาดจอ) */
interface Letterbox {
  backdrop: HTMLCanvasElement;
  feathers: { fill: CanvasGradient; box: Rect }[];
}

/** ขนาด/ตำแหน่งที่คำนวณครั้งเดียวต่อการ resize แทนที่จะคำนวณทุกเฟรม */
interface Layout {
  rect: Rect;
  letterbox: Letterbox | null;
}

type Rgb = string; // "r g b" — ใช้ได้ทั้ง rgb(r g b) และ rgb(r g b / 0)

/**
 * โหลดเฟรม WebP แบบ progressive แล้ววาดลง <canvas>
 * - ลำดับโหลด: เฟรมแรก → เฟรมสุดท้าย → ทุกๆ 4 เฟรม (load) → ที่เหลือ (loadAll เมื่อเริ่มเลื่อน)
 * - วาดใน requestAnimationFrame เฉพาะเมื่อเฟรมที่จะวาดเปลี่ยน (หรือหลัง resize)
 * - ถ้าเฟรมที่ต้องการยังไม่โหลด วาดเฟรมที่ใกล้ที่สุดที่โหลดแล้ว
 * - ความละเอียด canvas ไม่เกินรายละเอียดของภาพต้นฉบับ (ภาพ 1190px บนจอ retina ไม่ต้องใช้ canvas 2560px)
 */
export class FramePlayer {
  private readonly images: HTMLImageElement[] = [];
  private readonly loaded: boolean[];
  private readonly ctx: CanvasRenderingContext2D;
  private readonly mobileQuery = window.matchMedia(MQ.mobile);
  private readonly queue: number[] = [];
  private layout: Layout | null = null;
  private edgeColors: { top: Rgb; bottom: Rgb; left: Rgb; right: Rgb } | null = null;
  private target = 0;
  private drawn = -1;
  private dirty = true;
  private raf = 0;
  private workers = 0;
  private loadingKeys = false;
  private loadingRest = false;
  private destroyed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly source: SequenceSource,
  ) {
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.loaded = new Array(source.frameCount).fill(false);
  }

  /** ขั้นที่ 1: เฟรมแรก เฟรมสุดท้าย และทุกๆ 4 เฟรม (พอให้ scrub ได้หยาบๆ) — เรียกซ้ำได้ */
  load() {
    if (this.loadingKeys) return;
    this.loadingKeys = true;
    const last = this.source.frameCount - 1;
    const keys = [0, last];
    for (let i = KEY_STEP; i < last; i += KEY_STEP) keys.push(i);
    this.enqueue(keys);
  }

  /** ขั้นที่ 2: เฟรมที่เหลือ (เรียกเมื่อผู้ใช้เริ่มเลื่อน) — เรียกซ้ำได้ */
  loadAll() {
    this.load();
    if (this.loadingRest) return;
    this.loadingRest = true;
    const rest: number[] = [];
    for (let i = 1; i < this.source.frameCount - 1; i++) if (i % KEY_STEP !== 0) rest.push(i);
    this.enqueue(rest);
  }

  setFrame(frame: number) {
    const index = Math.min(this.source.frameCount - 1, Math.max(0, Math.round(frame)));
    if (index === this.target) return;
    this.target = index;
    this.schedule();
  }

  resize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    if (!width || !height) return;
    // ภาพถูกวาดกว้าง cssRect.w px บนจอ — มีรายละเอียดจริงแค่ source.width px
    // จึงไม่ต้องให้ canvas ละเอียดเกินนั้น (ลดพิกเซลที่ต้องวาดทุกเฟรม ภาพไม่ต่าง เพราะยังไงก็ถูกขยาย)
    const cssRect = fitRect(width, height, this.source, this.mobileQuery.matches);
    const detail = Math.max(1, this.source.width / cssRect.w);
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_DPR, detail);
    const w = Math.round(width * ratio);
    const h = Math.round(height * ratio);
    if (w !== this.canvas.width || h !== this.canvas.height) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.layout = null;
    this.dirty = true;
    this.schedule();
  }

  destroy() {
    // worker ที่กำลังโหลดจะหยุดเองเมื่อเห็น destroyed
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private schedule() {
    if (!this.raf && !this.destroyed) this.raf = requestAnimationFrame(this.render);
  }

  private render = () => {
    this.raf = 0;
    const index = this.nearestLoaded(this.target);
    if (index < 0 || (index === this.drawn && !this.dirty)) return;
    this.draw(index);
  };

  private nearestLoaded(target: number) {
    const count = this.source.frameCount;
    for (let d = 0; d < count; d++) {
      if (target - d >= 0 && this.loaded[target - d]) return target - d;
      if (target + d < count && this.loaded[target + d]) return target + d;
    }
    return -1;
  }

  private draw(index: number) {
    const { rect, letterbox } = this.getLayout(index);
    const ctx = this.ctx;
    if (letterbox) ctx.drawImage(letterbox.backdrop, 0, 0);
    ctx.drawImage(this.images[index], rect.x, rect.y, rect.w, rect.h);
    if (letterbox) {
      for (const { fill, box } of letterbox.feathers) {
        ctx.fillStyle = fill;
        ctx.fillRect(box.x, box.y, box.w, box.h);
      }
    }
    this.drawn = index;
    this.dirty = false;
  }

  private getLayout(index: number): Layout {
    if (this.layout) return this.layout;
    const { width: cw, height: ch } = this.canvas;
    const rect = fitRect(cw, ch, this.source, this.mobileQuery.matches);
    const isLetterbox = rect.w < cw - 1 || rect.h < ch - 1;
    this.layout = { rect, letterbox: isLetterbox ? this.buildLetterbox(rect, index) : null };
    return this.layout;
  }

  private buildLetterbox(rect: Rect, index: number): Letterbox {
    const { width: cw, height: ch } = this.canvas;
    if (!this.edgeColors) this.edgeColors = sampleEdges(this.images[this.loaded[0] ? 0 : index]);
    const c = this.edgeColors;
    const vertical = rect.h < ch; // แถบว่างบน/ล่าง (มิฉะนั้นซ้าย/ขวา)

    const backdrop = document.createElement("canvas");
    backdrop.width = cw;
    backdrop.height = ch;
    const bctx = backdrop.getContext("2d")!;
    const base = vertical ? bctx.createLinearGradient(0, 0, 0, ch) : bctx.createLinearGradient(0, 0, cw, 0);
    base.addColorStop(0, `rgb(${vertical ? c.top : c.left})`);
    base.addColorStop(1, `rgb(${vertical ? c.bottom : c.right})`);
    bctx.fillStyle = base;
    bctx.fillRect(0, 0, cw, ch);

    // gradient จากสีขอบ → สีเดียวกันแบบโปร่งใส (ไม่ใช่ดำโปร่งใส ขอบจะได้ไม่หมอง)
    const fade = (x0: number, y0: number, x1: number, y1: number, color: Rgb, box: Rect) => {
      const fill = this.ctx.createLinearGradient(x0, y0, x1, y1);
      fill.addColorStop(0, `rgb(${color})`);
      fill.addColorStop(1, `rgb(${color} / 0)`);
      return { fill, box };
    };
    const { x, y, w, h } = rect;
    const feathers = vertical
      ? [
          fade(0, y, 0, y + h * 0.12, c.top, { x, y, w, h: h * 0.12 }),
          fade(0, y + h, 0, y + h * 0.88, c.bottom, { x, y: y + h * 0.88, w, h: h * 0.12 }),
        ]
      : [
          fade(x, 0, x + w * 0.08, 0, c.left, { x, y, w: w * 0.08, h }),
          fade(x + w, 0, x + w * 0.92, 0, c.right, { x: x + w * 0.92, y, w: w * 0.08, h }),
        ];
    return { backdrop, feathers };
  }

  /** เพิ่มเฟรมเข้าคิว แล้วเปิด worker ให้ครบ CONCURRENCY ตัว */
  private enqueue(indices: number[]) {
    this.queue.push(...indices);
    while (this.workers < CONCURRENCY && this.queue.length && !this.destroyed) {
      this.workers++;
      void this.worker().finally(() => this.workers--);
    }
  }

  private async worker() {
    while (this.queue.length && !this.destroyed) {
      const index = this.queue.shift()!;
      if (this.images[index]) continue;
      const img = new Image();
      img.decoding = "async";
      img.src = frameUrl(this.source, index);
      this.images[index] = img;
      try {
        await img.decode();
      } catch {
        continue; // โหลดไม่ได้ — ข้ามไป ใช้เฟรมใกล้เคียงแทน
      }
      if (this.destroyed) return;
      this.loaded[index] = true;
      this.schedule();
    }
  }
}

/** สีเฉลี่ยของแถบขอบเฟรมแต่ละด้าน (ย่อแถบกว้าง 6px ลงเหลือ 1 พิกเซล) */
function sampleEdges(img: HTMLImageElement) {
  const probe = document.createElement("canvas");
  probe.width = probe.height = 1;
  const p = probe.getContext("2d", { willReadFrequently: true })!;
  const avg = (sx: number, sy: number, sw: number, sh: number): Rgb => {
    p.clearRect(0, 0, 1, 1);
    p.drawImage(img, sx, sy, sw, sh, 0, 0, 1, 1);
    const [r, g, b] = p.getImageData(0, 0, 1, 1).data;
    return `${r} ${g} ${b}`;
  };
  const { naturalWidth: w, naturalHeight: h } = img;
  const band = 6;
  return {
    top: avg(0, 0, w, band),
    bottom: avg(0, h - band, w, band),
    left: avg(0, 0, band, h),
    right: avg(w - band, 0, band, h),
  };
}
