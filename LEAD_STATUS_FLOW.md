# Lead Pipeline Flow — Sales CRM
> ไฟล์อ้างอิงหลัก สำหรับการออกแบบสถานะลีดทั้งระบบ
> สร้าง: 2026-08-10 | อ้างอิงจากโฟลที่หัวหน้าสรุป

---

## Pipeline Stage (5 ขั้นหลัก)

```
New Lead
    │
    ▼
1. Contact
    ├─ ติดต่อไม่ได้
    ├─ Follow
    ├─ นัด Meeting
    └─ Lost

    │
    ▼
2. Meeting
    ├─ เก็บ Requirement
    ├─ รอข้อมูล
    ├─ นัดเพิ่ม
    └─ ทำ Proposal

    │
    ▼
3. Proposal
    ├─ ส่ง Proposal
    ├─ แก้ไข
    ├─ ต่อรอง
    └─ รออนุมัติ

    │
    ▼
4. Approval
    ├─ รองบ
    ├─ เปิด PR
    ├─ รอ PO
    └─ Hold

    │
    ▼
5. Closed
    ├─ Won
    └─ Lost Field / ตัวอย่าง
```

---

## โครงสร้าง Data Model ที่ต้องแก้

| Field | ประเภท | ค่าที่รองรับ |
|---|---|---|
| `stage` | enum | Contact, Meeting, Proposal, Approval, Closed |
| `status` | enum (ขึ้นอยู่กับ stage) | ดูตารางด้านล่าง |
| `next_action_date` | date | วันที่ต้องติดตามครั้งถัดไป |

### Status ตาม Stage

| Stage | Status ที่เลือกได้ |
|---|---|
| Contact | ติดต่อไม่ได้, Follow, นัด Meeting, Lost |
| Meeting | เก็บ Requirement, รอข้อมูล, นัดเพิ่ม, ทำ Proposal |
| Proposal | ส่ง Proposal, แก้ไข, ต่อรอง, รออนุมัติ |
| Approval | รองบ, เปิด PR, รอ PO, Hold |
| Closed | Won, Lost Field |

---

## เหตุผลของการออกแบบนี้

- Sales เลือกข้อมูลได้ง่าย (dropdown 2 ระดับ: Stage > Status)
- Dashboard สรุป Pipeline ได้ทันที (groupBy stage)
- ไม่ต้องสร้างสถานะจำนวนมาก (รวมทั้งหมดแค่ ~15 status)
- รองรับการแจ้งเตือนงานติดตามอัตโนมัติจาก next_action_date

---

## งานที่ต้องทำ (TODO)

### Backend
- [ ] แก้ DB: เพิ่มคอลัมน์ stage ใน table leads
- [ ] Migration: ย้ายข้อมูล latest_status เก่า → stage + status ใหม่
- [ ] อัปเดต Lead model (CRUD)
- [ ] อัปเดต updateLead controller — รับ stage, status, next_action_date
- [ ] Validation: เช็คว่า status ที่ส่งมาตรงกับ stage ที่เลือก
- [ ] อัปเดต formatLead ให้ map ฟิลด์ใหม่ถูกต้อง

### Frontend
- [ ] แก้ validateLeadData ใน App.jsx — รองรับ stage/status ใหม่
- [ ] แก้ฟอร์มเพิ่มลีด (AddLeadForm) — dropdown Stage + Status แบบ 2 ระดับ
- [ ] แก้ฟอร์มแก้ไขลีด (CompanyModal / Inline Edit) — ใช้โครงสร้างเดียวกัน
- [ ] แก้ Dashboard — groupBy stage แทนสถานะเก่า
- [ ] ออกแบบหน้า Report ใหม่ ให้ต่างจาก Dashboard อย่างชัดเจน

### หน้า Report (Redesign)
- Dashboard = ภาพรวม Real-time Pipeline (Kanban / funnel / count)
- Report = วิเคราะห์เชิงลึก (ช่วงเวลา, Conversion Rate, ผลงานรายคน, Win/Lost analysis)

---

## Migration Map (สถานะเก่า → ใหม่)

| สถานะเก่า (latest_status) | Stage ใหม่ | Status ใหม่ |
|---|---|---|
| New Lead / ฝากโปรไฟล์ | Contact | Follow |
| ติดต่อไม่ได้ | Contact | ติดต่อไม่ได้ |
| Follow | Contact | Follow |
| นัด Meeting | Contact | นัด Meeting |
| เก็บ Requirement | Meeting | เก็บ Requirement |
| รอข้อมูล | Meeting | รอข้อมูล |
| นัดเพิ่ม | Meeting | นัดเพิ่ม |
| ทำ Proposal | Meeting | ทำ Proposal |
| ส่ง Proposal | Proposal | ส่ง Proposal |
| แก้ไข | Proposal | แก้ไข |
| ต่อรอง | Proposal | ต่อรอง |
| รออนุมัติ | Proposal | รออนุมัติ |
| รองบ | Approval | รองบ |
| เปิด PR | Approval | เปิด PR |
| รอ PO | Approval | รอ PO |
| Hold | Approval | Hold |
| Won | Closed | Won |
| Lost | Closed | Lost Field |
