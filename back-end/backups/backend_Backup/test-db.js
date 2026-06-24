const mysql = require("mysql2/promise");

async function testConn(pwd) {
  try {
    const conn = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: pwd
    });
    console.log(`✅ Success with password: "${pwd}"`);
    conn.end();
  } catch (err) {
    console.log(`❌ Failed with password: "${pwd}" - ${err.message}`);
  }
}

async function run() {
  const commonPasswords = ["@folk2546", "", "root", "1234", "123456", "12345678", "admin", "password"];
  for (const p of commonPasswords) {
    await testConn(p);
  }
}

run();
