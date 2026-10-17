import type { SceneMeta } from "../data/scenes";
import { useActiveScene } from "../lib/useActiveScene";
import OceanBackdrop from "./OceanBackdrop";
import SceneIndicator from "./SceneIndicator";

/**
 * ส่วนที่ขึ้นกับ "ฉากปัจจุบัน": สีน้ำพื้นหลัง + ตัวบอกฉาก
 * แยกเป็น component เล็ก เพื่อให้ state ฉากปัจจุบัน re-render เฉพาะส่วนนี้ ไม่ re-render ทั้ง 9 ฉาก
 */
export default function SceneChrome({ scenes, navLabel }: { scenes: SceneMeta[]; navLabel: string }) {
  const active = useActiveScene(scenes);
  return (
    <>
      <OceanBackdrop depth={scenes[active].depth} />
      <SceneIndicator scenes={scenes} active={active} label={navLabel} />
    </>
  );
}
