const pool = require('./config/db');

async function checkUsers() {
  try {
    const [users] = await pool.query('SELECT id, username, role FROM users');
    console.log("Users in system:", users);
    
    const [leads] = await pool.query('SELECT owner_id, COUNT(*) as count FROM leads GROUP BY owner_id');
    console.log("Leads by owner_id:", leads);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkUsers();
