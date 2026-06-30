const db = require('./config/db');

async function run() {
  const [users] = await db.execute("SELECT id, permissions FROM users WHERE permissions IS NOT NULL");
  for (const u of users) {
    if (!u.permissions) continue;
    let p = u.permissions;
    if (typeof p === 'string') p = JSON.parse(p);
    
    // Normalize Dashboard
    if (p.dashboard && p.dashboard.view === true) p.dashboard.view = 'all';
    if (p.dashboard && p.dashboard.view === 'select') {
      p.dashboard.view = 'own';
      p.dashboard.view_select = true;
    }
    
    // Normalize Leads
    if (p.leads && p.leads.view === true) p.leads.view = 'all';
    if (p.leads && p.leads.view === 'select') {
      p.leads.view = 'own';
      p.leads.view_select = true;
    }
    if (p.leads && p.leads.export === true) p.leads.export = 'all';
    if (p.leads && p.leads.export === false) p.leads.export = 'none';

    // Normalize Reports
    if (p.reports && p.reports.view === true) p.reports.view = 'all';
    if (p.reports && p.reports.view === 'select') {
      p.reports.view = 'own';
      p.reports.view_select = true;
    }
    if (p.reports && p.reports.export === true) p.reports.export = 'all';
    if (p.reports && p.reports.export === false) p.reports.export = 'none';

    await db.execute("UPDATE users SET permissions = ? WHERE id = ?", [JSON.stringify(p), u.id]);
    console.log(`Updated user ${u.id}`);
  }
  console.log("Done");
  process.exit(0);
}

run().catch(console.error);
