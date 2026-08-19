require('dotenv').config();
const db = require('./config/db');

async function migrate() {
  try {
    await db.execute(
      "ALTER TABLE leads ADD COLUMN stage VARCHAR(50) NOT NULL DEFAULT 'Contact' AFTER company_number"
    );
    console.log('✅ ALTER TABLE leads: added stage column');
    process.exit(0);
  } catch (e) {
    if (e.message.includes('Duplicate column name')) {
      console.log('ℹ️ Column stage already exists, skipping');
      process.exit(0);
    }
    console.error('❌', e.message);
    process.exit(1);
  }
}
migrate();
