interface InlineSvgProps {
  /** เนื้อ SVG ที่ import มาด้วย `?raw` */
  svg: string;
  className?: string;
  /** ถ้ามี alt จะห่อด้วย role="img" แล้วซ่อน SVG ด้านในจาก screen reader (ใช้ alt จาก content.md แทน) */
  alt?: string;
}

const hideInner = (svg: string) => svg.replace("<svg ", '<svg aria-hidden="true" focusable="false" ');

/** แทรก SVG แบบ inline เพื่อให้ GSAP เลือก element ด้านใน (#label-*, #waterline ฯลฯ) ได้ */
export default function InlineSvg({ svg, className = "", alt }: InlineSvgProps) {
  return (
    <div
      className={`inline-svg ${className}`}
      role={alt ? "img" : undefined}
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
      dangerouslySetInnerHTML={{ __html: hideInner(svg) }}
    />
  );
}
