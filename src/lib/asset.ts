// prefix ของไฟล์ใน public/ — บน GitHub Pages เว็บอยู่ใต้ /<repo>/ จึงห้ามใช้ path ที่ขึ้นต้นด้วย "/" ตรงๆ
// import.meta.env.BASE_URL มาจาก `base` ใน vite.config.ts (ลงท้ายด้วย "/" เสมอ)
export const BASE = import.meta.env.BASE_URL;
