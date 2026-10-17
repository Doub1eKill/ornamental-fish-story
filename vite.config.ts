import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages: workflow ตั้ง BASE_PATH=/<repo>/ · รันในเครื่อง (npm run dev) ใช้ "/"
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
});
