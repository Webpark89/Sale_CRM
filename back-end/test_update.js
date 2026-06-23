const db = require('./config/db');
async function test() {
  try {
    const id = 1;
    const company_name = 'test update';
    const company_number = null;
    const contact_name = null;
    const contact_phone = null;
    const contact_email = null;
    const description = null;
    const revenue = 0;
    const registered_capital = 0;
    const profit = 0;
    const is_starred = 0;

    console.log('Running UPDATE...');
    await db.execute(
      `UPDATE leads SET
        company_name = ?, company_number = ?, contact_name = ?,
        contact_phone = ?, contact_email = ?, description = ?,
        revenue = ?, registered_capital = ?, profit = ?,
        is_starred = ?
       WHERE id = ?`,
      [
        company_name, company_number, contact_name,
        contact_phone, contact_email, description,
        revenue, registered_capital, profit,
        is_starred, id
      ]
    );
    console.log('UPDATE OK. Running SELECT...');
    
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

    const [updated] = await db.execute(
      baseLeadQuery + ` WHERE l.id = ?`,
      [id]
    );
    console.log('SELECT OK:', updated[0]);
  } catch(e) {
    console.error('ERROR', e);
  }
  process.exit(0);
}
test();
