const mysql = require('mysql2/promise');

async function fixHashes() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '@Folk2546',
    database: 'qoraqot_crm'
  });

  const hash123456 = '$2a$10$NYz1nxdv0I5p8lL2Dh8z7On4WggoKQUJRoJbmigKi6vUaSqfPIPBe';
  const hash1234 = '$2a$10$pnQpASu9.tgBI3nbDIegHu9YGd8p8ehK89/kJNVTJaymy2.s8a94u';

  await conn.execute('UPDATE users SET password = ? WHERE username = ?', [hash123456, 'admin']);
  await conn.execute('UPDATE users SET password = ? WHERE username IN (?, ?)', [hash1234, 'crm1', 'crm2']);

  console.log('✅ Hashes updated successfully!');
  await conn.end();
}

fixHashes();
