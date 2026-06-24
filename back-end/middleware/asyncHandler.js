// ==========================================
// middleware/asyncHandler.js - รปภ. ดักจับ Error อัตโนมัติ
// ==========================================
// ตัวนี้ทำหน้าที่รับฟังก์ชันจาก Controller มา "ห่อหุ้ม" ด้วย try-catch ให้แบบอัตโนมัติ
// ทำให้เราไม่ต้องเขียน try-catch ซ้ำๆ ในทุกฟังก์ชันของ Controller อีกต่อไป

const asyncHandler = (fn) => (req, res, next) => {
  // รันฟังก์ชัน fn ถ้าสำเร็จก็จบไป แต่ถ้ามี Error (catch) ให้ส่งไปที่ส่วนจัดการ Error หลักของ Express
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error("เกิดข้อผิดพลาดในระบบ:", err);
    
    // ตรงนี้เราอาจจะเพิ่ม Logic ในอนาคตได้ เช่น ถ้า Error รหัสนี้ ให้ตอบกลับแบบนี้
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "ข้อมูลนี้มีอยู่ในระบบแล้ว (ข้อมูลซ้ำ)" });
    }
    
    if (err.code === "ER_DATA_TOO_LONG") {
      // ดึงชื่อคอลัมน์จาก error message เพื่อให้ผู้ใช้รู้ว่าช่องไหนยาวไป
      return res.status(400).json({ error: "ข้อมูลที่กรอกยาวเกินไป: " + (err.sqlMessage || "กรุณาตรวจสอบอีกครั้ง") });
    }

    if (err.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD" || err.code === "ER_TRUNCATED_WRONG_VALUE") {
      return res.status(400).json({ error: "รูปแบบข้อมูลไม่ถูกต้อง (เช่น ใส่อีเมลเป็นภาษาไทย): " + (err.sqlMessage || "") });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "ระบบเกิดข้อผิดพลาด: " + (err.sqlMessage || err.message || "ไม่ทราบสาเหตุ") });
  });
};

module.exports = asyncHandler;
