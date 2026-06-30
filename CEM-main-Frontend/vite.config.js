import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // error ทันทีถ้า port ถูกใช้อยู่ ไม่ auto-switch
  },
});