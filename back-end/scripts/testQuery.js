const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({ host: 'localhost', user: 'root', password: '@Folk2546', database: 'qoraqot_crm' });
  const baseLeadQuery = `
  SELECT 
    l.*,
    u.username AS owner_username,
    f.status AS latest_status,
    f.contact_date AS latest_contact_date,
    f.next_followup_date AS next_followup_date,
    (SELECT COUNT(*) FROM followups WHERE lead_id = l.id AND status = 'มีตติ้ง') > 0 AS ever_had_meeting
  FROM leads l
  JOIN users u ON l.owner_id = u.id
  LEFT JOIN (
      SELECT f1.lead_id, f1.status, f1.contact_date, f1.next_followup_date
      FROM followups f1
      INNER JOIN (
          SELECT lead_id, MAX(id) as max_id
          FROM followups
          GROUP BY lead_id
      ) f2 ON f1.id = f2.max_id
  ) f ON f.lead_id = l.id
  `;
  const [rows] = await db.execute(baseLeadQuery + ' WHERE l.owner_id = ?', [1]);
  console.log('Rows for admin:', rows.length);
  if(rows.length > 0) console.log(rows[0]);
  process.exit(0);
}
run();
