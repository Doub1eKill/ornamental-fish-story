# การเลี้ยงปลาสวยงาม — Cinematic Scrolling Slideshow

เว็บเล่าเรื่องแบบเลื่อนหน้าจอ 9 ฉาก จากเอกสาร `กลางภาค-1.pdf` / `กลางภาค-2.pdf` (ดร. ภัทริดา เริงจิตร)
React + TypeScript + Vite + GSAP (ScrollTrigger, @gsap/react) + lucide-react · CSS ธรรมดา · ไม่มี backend

## ติดตั้งเครื่องมือ (ครั้งแรก)

```bash
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Gyan.FFmpeg -e
```

เปิด terminal ใหม่หลังติดตั้งเพื่อให้ PATH อัปเดต · ffmpeg ใช้เฉพาะตอนแตกเฟรม image sequence (เฟรมที่แตกแล้วอยู่ใน `public/sequences/` พร้อมใช้)

## รันโปรเจกต์

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # ตรวจ type (tsc) + build ไปที่ dist/
npm run preview   # เปิดดูไฟล์ build ที่ http://localhost:4173
```

## Deploy (static)

ใช้ได้กับ Vercel / Netlify / GitHub Pages: build command `npm run build` · output directory `dist`
ไม่ต้องตั้ง environment variable ใดๆ (ขนาด dist ≈ 14MB ส่วนใหญ่เป็นเฟรม WebP)

## ฉากและการเคลื่อนไหว

| ฉาก | เนื้อหา | Motion (ไม่ลด motion) |
|---|---|---|
| 01 | Hero | **SEQ-1** image sequence · pin 300vh · ข้อความ 3 ช่วง |
| 02 | ปลามีลักษณะอย่างไร | 9 ข้อ fade-up stagger (มือถือ: ทีละข้อ) |
| 03 | อวัยวะภายนอก | **SEQ-2** · pin 250vh · label 9 จุด (มือถือ: ชิปทีละอัน) |
| 04 | ปลาเขตร้อน 8 กลุ่ม | ≥ 768px: pin + เลื่อนการ์ดแนวนอน · มือถือ: แนวตั้ง reveal ทีละใบ |
| 05 | ปลาเขตหนาว | ปลา 2 ตัว parallax คนละความเร็ว |
| 06 | พรรณไม้น้ำ 4 ประเภท | เส้นผิวน้ำวาดซ้าย→ขวา · label ตามลำดับ |
| 07 | การจัดตู้ | **SEQ-3** · pin 280vh · กรอบโซนหลัง/กลาง/หน้า + หลักเกณฑ์ |
| 08 | ปัจจัยต่อพรรณไม้น้ำ | การ์ด stagger · แถบ pH เติมช่วง 6.5–7.4 |
| 09 | Ending | คำถาม + 5 หัวข้อ stagger · ปุ่มกลับด้านบน |

**Scroll assist** (`src/lib/scrollAssist.ts`): เลื่อนนิดเดียว (wheel / trackpad / touch / ลูกศร) แล้วหยุด ระบบพาเลื่อนต่อไปยังจุดถัดไปในทิศนั้นเอง
(ข้อความขึ้นครบ / animation จบ / การ์ดใบถัดไป / ขอบฉาก) ไม่ดึงย้อนกลับ · ระหว่างเลื่อนให้ บล็อกการเลื่อนแทรกจนถึงจุดหมาย
· เนื้อหายาวเกิน 2 หน้าจอเลื่อนทีละ 0.9 หน้าจอ · จุดหยุดของฉาก pin ตั้งที่ `snap` ใน `src/data/sequences.ts` · ปิดเมื่อ reduced motion

ทุกฉาก: สีน้ำพื้นหลังเข้มขึ้นตามความลึก (`--depth-0` → `--depth-4`) · ภาพพื้นหลัง crossfade + parallax ≤ 80px · ตัวบอกฉากมุมขวาบน

## Image sequence

```bash
bash scripts/extract-frames.sh seq-1-hero            # 192 เฟรม · 24fps · 5.1MB
bash scripts/extract-frames.sh seq-2-anatomy         # 192 เฟรม · 2.9MB
bash scripts/extract-frames.sh seq-3-aquascape 6.4   # 154 เฟรม (ใช้แค่ 0–6.4s) · 4.9MB
```

- สคริปต์ครอปลายน้ำ ✦ มุมขวาล่างและแถบดำ 4px ขอบบนออก → 1190×666 (ไม่ขยายภาพ) แล้วเขียน WebP q70 ไปที่ `public/sequences/<name>/`
- config ทุกชุดอยู่ใน `src/data/sequences.ts` (จำนวนเฟรม, ระยะ pin, focal point, fit cover/contain)
  เพิ่มเฟรม 9:16 ภายหลังได้โดยเพิ่ม source ที่มี `media` ใน config — ไม่ต้องแก้ component
- `<ImageSequence>` วาดลง canvas (รองรับ devicePixelRatio ≤ 2) วาดใน rAF เฉพาะเมื่อเฟรมเปลี่ยน
- การโหลด: เฟรมหลัก (ทุก 4 เฟรม) เมื่อฉากเข้าใกล้จอ → เฟรมที่เหลือเมื่อผู้ใช้เริ่มเลื่อน
- label ฉาก 03 อยู่ใน `src/assets/svg/fish-anatomy.svg` (พิกัดวัดใหม่จากเฟรมสุดท้ายจริง)

## โครงสร้าง

```
design/                   ไฟล์ดีไซน์ต้นฉบับ (ไม่ถูก build)
scripts/extract-frames.sh แตกเฟรมจากคลิป
public/backgrounds/       พื้นหลัง WebP ของแต่ละฉาก
public/graphics/          SVG ภาพประกอบปลา (fallback เมื่อภาพถ่ายโหลดไม่ได้)
public/images/fish/       ภาพถ่ายปลาฉาก 04/05 (WebP 800px จาก design/fish-cards — 2 ไฟล์ .png ครอปลายน้ำ 93%)
public/images/plant-levels.webp  ภาพจริงฉาก 06 (1600px) — ป้าย/จุด/เส้นชี้เป็น HTML ใน AnnotatedPhoto · SVG เดิมเป็น fallback
public/sequences/         เฟรม WebP ของ SEQ-1/2/3
src/assets/svg/           SVG ที่ต้อง inline เพื่อ animate (anatomy, diagram, icon)
src/data/scenes.ts        ข้อความทุกฉาก (คัดจาก design/content.md) — แก้ข้อความที่นี่ที่เดียว
src/data/sequences.ts     config ของ image sequence
src/components/           SceneShell, ImageSequence, CardRail, LabeledDiagram, InlineSvg,
                          SceneIndicator, OceanBackdrop, ScrollPrompt, BackToTop
src/scenes/               9 ฉาก ประกอบจาก component ด้านบน
src/lib/gsap.ts           ลงทะเบียน plugin GSAP ครั้งเดียว
src/lib/motion.ts         reveal / parallax / useSceneMotion (รวม reduced motion + breakpoint)
src/lib/FramePlayer.ts    โหลดและวาดเฟรมลง canvas
src/lib/media.ts          media query กลาง (mobile < 768 · tablet 768–1023 · desktop ≥ 1024)
src/lib/useScrollRestoration.ts  คืนตำแหน่ง scroll หลัง refresh / ลิงก์ #ฉาก / ข้าม breakpoint
src/styles/               global.css (tokens) · scenes.css (layout)
```

## Accessibility

- `prefers-reduced-motion: reduce`: ไม่ pin ไม่ scrub ไม่ parallax · image sequence แสดงเฟรมสุดท้ายเป็นภาพนิ่ง · เนื้อหาแสดงครบทันที · สีพื้นเปลี่ยนเป็นขั้น · ปุ่มกลับด้านบนกระโดดทันที
- ข้อความที่ยังไม่ reveal ใช้ `opacity` (ไม่ใช่ `visibility:hidden`) จึงยังอยู่ใน accessibility tree
- skip link "ข้ามไปที่เนื้อหา" · ตัวบอกฉากเป็นลิงก์ (พื้นที่กด 24×24px) · ปุ่มกลับด้านบนย้าย focus ไปหัวเรื่องฉากแรก · focus ring สีส้ม
- alt text ทุกภาพจาก `content.md` · พื้นหลังตกแต่งใช้ `alt=""` · label ใน SVG มีรายการข้อความให้ screen reader อ่านแทน
- contrast (คำนวณตาม WCAG): ข้อความหลัก 5.0–15.6:1 · เลขฉาก/คำเน้นสีส้มอ่อน ≥ 4.7:1 · overlay ไล่สีบนภาพ sequence

## ผลการทดสอบล่าสุด

Lighthouse 12.6 บน `npm run preview` (Chrome headless):

| | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Desktop | 100 | 100 | 100 | 100 |
| Mobile (จำลอง 4G + CPU ช้า 4×) | 74–76 | 100 | 100 | 100 |

Mobile: LCP 4.2–4.4s / FCP 2.5–2.7s / CLS 0.002 · โหลดตอนเปิดหน้า ≈ 1.5MB — LCP ช้าเพราะหน้า render ฝั่ง client
และฟอนต์ไทยจาก Google Fonts swap เข้ามาทีหลัง (ทางแก้ถ้าต้องการ: self-host ฟอนต์ หรือ pre-render ฉากแรก)

ทดสอบด้วย headless Chrome (puppeteer):
- โหลดเฟรมสองขั้น: เปิดหน้า 49 เฟรม → เลื่อนครั้งแรกครบ 192 · SEQ-2/3 โหลดครบเมื่อเลื่อนถึง
- เลื่อนตลอดหน้าแล้วไม่มีเนื้อหาค้างโปร่งใส · console ไม่มี error
- reduced motion: ไม่มี pin/canvas · โหลดเฉพาะภาพนิ่งเฟรมสุดท้าย · ไม่มีเนื้อหาโปร่งใส
- refresh กลางหน้า → กลับตำแหน่งเดิม · เปิดลิงก์ `#scene-07` → ไปฉากนั้น
- resize ข้าม breakpoint 768px (เช่นหมุนจอ) → อยู่ฉากเดิม · ฉาก 04 สลับแนวนอน/แนวตั้งถูกต้อง

ทดสอบด้วยตาใน browser: desktop 1280×720, มือถือ 375×812, เลื่อนขึ้น-ลง, ลำดับ Tab ด้วยคีย์บอร์ด

**ยังไม่ได้ทดสอบ:** มือถือ/แท็บเล็ตจริง (touch), Safari/iOS, Firefox

## Acceptance criteria (จาก brief)

- [x] Storytelling scenes ≥ 4 ฉาก — 9 ฉาก
- [x] แต่ละฉากมีเนื้อหาและหน้าที่ชัดเจน (ข้อความจาก `content.md` เท่านั้น)
- [x] Fade-in และ Scroll-linked animation (image sequence scrub, parallax)
- [x] Animation ทำงานทั้งเลื่อนลงและย้อนกลับขึ้น
- [x] ไม่มี error ใน console
- [x] ไม่มี ScrollTrigger ซ้ำ/ค้างเมื่อ component ถูกสร้างใหม่ (useGSAP + matchMedia revert, ทดสอบใน StrictMode)
- [x] Layout ใช้งานได้บน desktop และ mobile
- [x] รองรับ `prefers-reduced-motion`
- [x] รูปภาพโหลดได้จริงและมี alt text
- [x] `npm run build` สำเร็จ
- [x] มีคำแนะนำการรันโปรเจกต์ใน README

## สิ่งที่ปรับจาก spec (และเหตุผล)

- **Breakpoint มือถือ < 768px** ตามที่สั่ง (motion-notes เดิมใช้ ≤ 599px)
- **SEQ-2 ใช้ fit "contain"** (ไม่ใช่ cover) เพื่อให้ label 9 จุดอยู่บนจอครบทุกสัดส่วนจอ และมือถือได้ปลาเต็มกว้างที่ y ≈ 38–62% ตาม safe area · พื้นที่ว่างเติมด้วยสีขอบเฟรม
- **label SEQ-2 เริ่มที่ 52% ของ scroll** (spec เดิม 38%) เพราะคลิปจริงปลานิ่งตั้งแต่ ~50%
- **ชื่อเรื่องฉาก 01 แสดงทันที** ไม่ fade-in ตอนโหลด (h1 เป็น LCP ของหน้า) · scroll prompt แสดงตอนเริ่ม จางออกเมื่อเลื่อน และกลับมาที่ 95%
- เฟรมกว้าง 1190px (ครอปจาก 1280 แล้วไม่ขยายกลับ)
- `design/graphics/fish-anatomy.svg` ไม่ถูกแก้ — ไฟล์ที่ใช้จริงคือ `src/assets/svg/fish-anatomy.svg`

## หมายเหตุเนื้อหา

- ฉาก 08: ประโยค "pH = 3.5 / เติมคาร์บอนไดออกไซด์" คัดตามเอกสาร แต่มี `TODO: รอยืนยันกับผู้สอน` ใน `src/data/scenes.ts`
  (content.md แนะนำ: ถ้าไม่ยืนยัน ให้แสดงเฉพาะช่วง pH 6.5–7.4)
- ข้อความ UI ที่ไม่ได้มาจาก PDF: "เลื่อนลงเพื่อดำดิ่ง", "กลับด้านบน", "ข้ามไปที่เนื้อหา"

## Deploy (GitHub Pages)

- `.github/workflows/deploy.yml` build และ deploy อัตโนมัติทุกครั้งที่ push ขึ้น `main`
- เว็บอยู่ใต้ path `/<ชื่อ repo>/` — workflow ส่ง `BASE_PATH` ให้ `vite.config.ts` เอง
- path ของไฟล์ใน `public/` ในโค้ดต้องขึ้นต้นด้วย `${BASE}` จาก `src/lib/asset.ts` ห้ามเขียน `"/images/..."` ตรงๆ (จะ 404 บน Pages)
- ทดสอบแบบเดียวกับบน Pages ในเครื่อง: `BASE_PATH=/ornamental-fish-story/ npm run build && npx vite preview`
- `docs/` (PDF ของผู้สอน) และ `design/` ไม่ขึ้น repo (ดู `.gitignore`)
