/**
 * กล่องที่ใช้วัดระยะ scroll จริงของฉาก: ถ้าฉากถูก pin จะเป็น .pin-spacer ที่ ScrollTrigger ครอบไว้
 * (สูงกว่า section เพราะรวมระยะ pin) — มิฉะนั้นคือ section เอง
 */
export function scrollBlockOf(section: HTMLElement): HTMLElement {
  const parent = section.parentElement;
  return parent?.classList.contains("pin-spacer") ? parent : section;
}
