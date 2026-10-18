import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { FramePlayer, fitRect } from "../lib/FramePlayer";
import { MQ } from "../lib/media";
import { addSnapPoints, pointsOnTrigger } from "../lib/scrollAssist";
import { useMediaQuery } from "../lib/useMediaQuery";
import { frameUrl, pickSource, type SequenceConfig } from "../data/sequences";

export interface SequenceBuildContext {
  isMobile: boolean;
  /** section ของฉาก — ใช้ค้นหา element แทนการอ้าง id ของฉากตรงๆ */
  section: HTMLElement;
}

interface ImageSequenceProps {
  config: SequenceConfig;
  alt: string;
  /**
   * เพิ่ม tween ลง timeline เดียวกับเฟรม — timeline ยาว 1 หน่วย = 0–100% ของ scroll ในฉาก
   * เช่น tl.to(".x", { opacity: 0, duration: 0.06 }, 0.26) = ออกช่วง 26–32%
   * ถูกเรียกใหม่เมื่อข้าม breakpoint มือถือ/จอใหญ่
   */
  build?: (tl: gsap.core.Timeline, ctx: SequenceBuildContext) => void;
  /** โหลด poster ทันที (ฉากแรก) — ฉากอื่นโหลดเมื่อใกล้เข้าจอ */
  priority?: boolean;
  /** overlay ที่วางทับเฟรมพอดี (หน่วยพิกัดเดียวกับเฟรม) เช่น SVG label */
  children?: ReactNode;
}

/**
 * Image sequence ผูกกับ scroll: pin <section> ที่ครอบอยู่ + scrub frame index ลง <canvas>
 * ต้องวางไว้ใน SceneShell (prop `backdrop`) · selector ใน build ค้นหาเฉพาะใน section นั้น
 * prefers-reduced-motion: ไม่ pin ไม่ scrub แสดงเฟรมสุดท้ายเป็นภาพนิ่ง
 */
export default function ImageSequence({ config, alt, build, priority = false, children }: ImageSequenceProps) {
  const reduced = useMediaQuery(MQ.reduced);
  const source = useMemo(() => pickSource(config), [config]);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);

  // วาง overlay + poster ให้ตรงกับตำแหน่งเฟรม (fitRect ตัวเดียวกับ canvas — รองรับ fit/focal/zoom)
  // ทำงานทั้งโหมดปกติและ reduced motion (reduced ใช้ poster เป็นภาพนิ่ง label จึงต้องตรงกับ poster)
  useEffect(() => {
    const root = rootRef.current;
    const overlay = overlayRef.current;
    const poster = posterRef.current;
    if (!root || !overlay) return;
    const mobileQuery = window.matchMedia(MQ.mobile);
    const place = () => {
      const r = fitRect(root.clientWidth, root.clientHeight, source, mobileQuery.matches);
      const box = { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` };
      Object.assign(overlay.style, box);
      if (poster) {
        Object.assign(poster.style, box);
        poster.classList.add("is-placed");
      }
    };
    place();
    const resizeObserver = new ResizeObserver(place);
    resizeObserver.observe(root);
    return () => resizeObserver.disconnect();
  }, [source]);

  useGSAP(
    () => {
      const canvas = canvasRef.current;
      // หา <section> จาก DOM แทน ref ของแม่: layout effect ของลูกรันก่อน React ผูก ref ของ element แม่
      const section = canvas?.closest("section");
      if (reduced || !section || !canvas) return;

      const player = new FramePlayer(canvas, source);
      player.resize();
      const resizeObserver = new ResizeObserver(() => player.resize());
      resizeObserver.observe(canvas);

      // โหลดเฟรมเมื่อฉากอยู่ห่างจอไม่เกิน ~2 หน้าจอ: เฟรมหลัก (ทุก 4 เฟรม) ก่อน
      // แล้วเฟรมที่เหลือเมื่อผู้ใช้เริ่มเลื่อน — หน้าแรกจึงไม่ต้องโหลดครบ ~5MB ตั้งแต่เปิด
      const loadRest = () => player.loadAll();
      const loadObserver = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          loadObserver.disconnect();
          player.load();
          if (window.scrollY > 0) loadRest();
          else window.addEventListener("scroll", loadRest, { once: true, passive: true });
        },
        { rootMargin: "200% 0px" },
      );
      loadObserver.observe(section);

      // ข้อความแต่ละช่วงซ้อนตำแหน่งเดียวกัน (ดู CSS .is-sequenced)
      section.classList.add("is-sequenced");

      // matchMedia สร้าง timeline ใหม่เมื่อข้าม breakpoint · scope = section ให้ selector ใน build ค้นหาเฉพาะในฉากนี้
      const mm = gsap.matchMedia(section);
      mm.add({ isMobile: MQ.mobile, isWide: MQ.wide }, (context) => {
        const state = { frame: 0 };
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${(window.innerHeight * config.pinVh) / 100}`,
            pin: true,
            scrub: config.scrub,
            invalidateOnRefresh: true,
          },
        });
        tl.to(state, { frame: source.frameCount - 1, duration: 1, onUpdate: () => player.setFrame(state.frame) }, 0);
        build?.(tl, { isMobile: Boolean(context.conditions?.isMobile), section });
        // scroll assist: หยุดตรงจังหวะที่ข้อความขึ้นครบ (config.snap)
        if (config.snap && tl.scrollTrigger) return addSnapPoints(pointsOnTrigger(tl.scrollTrigger, config.snap));
      });

      return () => {
        mm.revert();
        loadObserver.disconnect();
        window.removeEventListener("scroll", loadRest);
        resizeObserver.disconnect();
        player.destroy();
        section.classList.remove("is-sequenced");
      };
    },
    { dependencies: [reduced, source], revertOnUpdate: true },
  );

  const style = {
    "--focal-x": `${source.focal.desktop.x * 100}%`,
    "--focal-y": `${source.focal.desktop.y * 100}%`,
    "--focal-x-mobile": `${source.focal.mobile.x * 100}%`,
    "--focal-y-mobile": `${source.focal.mobile.y * 100}%`,
    "--fit": source.fit.desktop,
    "--fit-mobile": source.fit.mobile,
    "--seq-fill": source.fill,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="seq" role="img" aria-label={alt} style={style}>
      {/* poster ระหว่างโหลด = เฟรมแรก · reduced motion = เฟรมสุดท้าย */}
      <img
        ref={posterRef}
        className="seq__poster"
        src={frameUrl(source, reduced ? source.frameCount - 1 : 0)}
        alt=""
        width={source.width}
        height={source.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
      />
      {!reduced && <canvas ref={canvasRef} className="seq__canvas" />}
      <div className="seq__grain" />
      <div ref={overlayRef} className="seq__overlay">
        {children}
      </div>
    </div>
  );
}
