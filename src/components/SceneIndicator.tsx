import type { SceneMeta } from "../data/scenes";

interface SceneIndicatorProps {
  scenes: SceneMeta[];
  /** index ของฉากปัจจุบัน (จาก useActiveScene) */
  active: number;
  label: string;
}

/** ตัวบอกฉากมุมขวาบน — ลิงก์ไปแต่ละฉาก ใช้คีย์บอร์ดได้ */
export default function SceneIndicator({ scenes, active, label }: SceneIndicatorProps) {
  return (
    <nav className="scene-indicator" aria-label={label}>
      <p className="scene-indicator__count" aria-hidden="true">
        {scenes[active].number} / {scenes[scenes.length - 1].number}
      </p>
      <ol className="scene-indicator__list">
        {scenes.map((scene, index) => (
          <li key={scene.id}>
            <a
              className="scene-indicator__dot"
              href={`#${scene.id}`}
              aria-label={`${scene.number} ${scene.title}`}
              aria-current={index === active ? "step" : undefined}
            />
          </li>
        ))}
      </ol>
    </nav>
  );
}
