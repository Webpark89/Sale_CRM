import axios from "axios";

// กำหนด URL ของ Backend
// ระหว่างพัฒนา (Dev) ใช้ http://localhost:3001
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor: ดึง Token จาก localStorage ใส่ใน Header อัตโนมัติทุกครั้งที่ยิง API
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("crm_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: จัดการ Error ส่วนกลาง (เช่น Token หมดอายุ)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token หมดอายุ หรือไม่ได้รับอนุญาต -> ลบข้อมูลและพาไปหน้า Login
      localStorage.removeItem("crm_token");
      localStorage.removeItem("crm_session");
      localStorage.removeItem("crm_user");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;
