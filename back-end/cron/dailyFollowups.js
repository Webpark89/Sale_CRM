const cron = require("node-cron");
const db = require("../config/db");
const { sendLineGroupNotify } = require("../services/lineService");

/**
 * ดึงรายการลีดทั้งหมดที่ต้องติดตามในวันนี้ และส่งสรุปเข้า LINE Group
 */
async function sendDailyFollowupSummary() {
  try {
    console.log("Cron Job: Running daily follow-up summary check...");

    const query = `
      SELECT 
        l.id,
        l.company_name,
        l.contact_name,
        l.contact_phone,
        u.username AS owner_name,
        COALESCE(f.status, 'ทั่วไป') AS current_status,
        f.next_followup_date
      FROM leads l
      JOIN users u ON l.owner_id = u.id
      JOIN (
          SELECT f1.lead_id, f1.status, f1.next_followup_date, f1.completed
          FROM followups f1
          INNER JOIN (
              SELECT lead_id, MAX(id) as max_id
              FROM followups
              GROUP BY lead_id
          ) f2 ON f1.id = f2.max_id
      ) f ON f.lead_id = l.id
      WHERE l.is_deleted = 0
        AND f.completed = 0
        AND DATE(f.next_followup_date) = CURDATE()
      ORDER BY u.username ASC, l.company_name ASC
    `;

    const [rows] = await db.execute(query);

    const todayStr = new Date().toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    if (!rows || rows.length === 0) {
      const emptyMsg = `📅 [รายงานสรุปรายการติดตามวันนี้]\nประจำวันที่ ${todayStr}\n\n🎉 วันนี้ไม่มีรายการลีดที่ต้องติดตามครับ!`;
      await sendLineGroupNotify(emptyMsg);
      console.log("Cron Job: No follow-ups due today. Notification sent.");
      return { total: 0, message: emptyMsg };
    }

    // จัดกลุ่มลีดตามชื่อผู้ดูแล (owner_name)
    const grouped = {};
    rows.forEach((r) => {
      const owner = r.owner_name || "ไม่ระบุเซลส์";
      if (!grouped[owner]) {
        grouped[owner] = [];
      }
      grouped[owner].push(r);
    });

    let msg = `📋 [สรุปรายการติดตามลีดประจำวัน]\n🗓 ประจำวันที่: ${todayStr}\n───────────────────`;
    let count = 0;

    for (const [owner, items] of Object.entries(grouped)) {
      msg += `\n\n👤 ผู้รับผิดชอบ: คุณ ${owner} (${items.length} รายการ)`;
      items.forEach((item, idx) => {
        count++;
        msg += `\n\n▫️ ${idx + 1}. ${item.company_name}`;
        msg += `\n   • สถานะ: ${item.current_status}`;
        if (item.contact_name) {
          msg += `\n   • ผู้ติดต่อ: คุณ ${item.contact_name}`;
        }
        if (item.contact_phone) {
          msg += `\n   • เบอร์โทร: 📞 ${item.contact_phone}`;
        }
      });
    }

    msg += `\n\n───────────────────\n📌 รวมทั้งหมด ${count} รายการที่ต้องติดตามวันนี้ 🚀`;

    await sendLineGroupNotify(msg);
    console.log(`Cron Job: Sent daily summary for ${count} follow-ups.`);
    return { total: count, message: msg };
  } catch (error) {
    console.error("Cron Job Error in sendDailyFollowupSummary:", error);
    throw error;
  }
}

/**
 * ตั้งเวลาสำหรับ Cron Job (ทุกวันเวลา 08:30 น.)
 */
function initDailyFollowupCron() {
  // รันทุกวันเวลา 08:30 น. (วินาที นาที ชั่วโมง วัน เดือน วันในสัปดาห์)
  cron.schedule("30 8 * * *", () => {
    sendDailyFollowupSummary().catch((err) => {
      console.error("Failed to execute daily follow-up cron:", err);
    });
  }, {
    timezone: "Asia/Bangkok"
  });

  console.log("Cron Job Initialized: Daily follow-up summary scheduled for 08:30 AM (Asia/Bangkok)");
}

module.exports = {
  sendDailyFollowupSummary,
  initDailyFollowupCron
};
