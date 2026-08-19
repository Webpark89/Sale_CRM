const pool = require('./config/db');

async function cleanAndSeed() {
  try {
    console.log("Cleaning old leads...");
    await pool.query('DELETE FROM followups');
    await pool.query('DELETE FROM leads');
    console.log("All old leads deleted.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanAndSeed();
