// migrate_roles.js
// ==========================================
// Script สำหรับล้าง DB เดิมและสร้างโครงสร้าง Role ใหม่
// รันครั้งเดียว: node migrate_roles.js
// ==========================================

const db = require('./config/db');
const bcrypt = require('bcryptjs');

const SUPER_ADMIN_PERMISSIONS = {
  leads:     { menu: true, view: true, create: true, update: true, delete: true, reassign: true, export: true },
  dashboard: { menu: true, view: 'all' },
  reports:   { menu: true, view: true, export: true },
  roles:     { menu: true, view: true, create: true, update: true, delete: true },
  users:     { menu: true, view: true, create: true, update: true, delete: true }
};

async function run() {
  const conn = await db.getConnection();
  try {
    console.log('🔥 เริ่มต้น Migration...\n');

    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    // ─── Step 1: ล้างข้อมูลทั้งหมด ─────────────────────────────────
    console.log('🗑️  ล้างตาราง audit_logs, followups, leads, users...');
    await conn.query('TRUNCATE TABLE audit_logs');
    await conn.query('TRUNCATE TABLE followups');
    await conn.query('TRUNCATE TABLE leads');
    await conn.query('TRUNCATE TABLE users');
    console.log('   ✅ ล้างข้อมูลสำเร็จ\n');

    // ─── Step 2: สร้างตาราง roles ─────────────────────────────────
    console.log('🏗️  สร้างตาราง roles...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        name         VARCHAR(50)  NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        permissions  LONGTEXT     NOT NULL,
        is_system    TINYINT(1)   NOT NULL DEFAULT 0,
        created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✅ สร้างตาราง roles สำเร็จ\n');

    // ─── Step 3: แก้โครงสร้างตาราง users ─────────────────────────
    console.log('🔧  แก้โครงสร้างตาราง users...');

    // ลบ column role เดิม (enum)
    const [cols] = await conn.query(`SHOW COLUMNS FROM users LIKE 'role'`);
    if (cols.length > 0) {
      await conn.query('ALTER TABLE users DROP COLUMN role');
      console.log('   🗑️  ลบ column role (enum) แล้ว');
    }

    // ลบ column permissions เดิมจาก users (จะใช้ของ roles แทน)
    const [permCols] = await conn.query(`SHOW COLUMNS FROM users LIKE 'permissions'`);
    if (permCols.length > 0) {
      await conn.query('ALTER TABLE users DROP COLUMN permissions');
      console.log('   🗑️  ลบ column permissions จาก users แล้ว');
    }

    // ตรวจว่า role_id มีอยู่แล้วหรือยัง
    const [roleIdCols] = await conn.query(`SHOW COLUMNS FROM users LIKE 'role_id'`);
    if (roleIdCols.length === 0) {
      await conn.query('ALTER TABLE users ADD COLUMN role_id INT NOT NULL AFTER display_name');
      console.log('   ➕ เพิ่ม column role_id แล้ว');
    }

    // รีเซ็ต AUTO_INCREMENT ของ users
    await conn.query('ALTER TABLE users AUTO_INCREMENT = 1');
    console.log('   🔄 รีเซ็ต AUTO_INCREMENT ของ users แล้ว\n');

    // ─── Step 4: เพิ่ม Foreign Key (หลังจาก insert roles แล้ว) ────────
    // ลบ FK เดิมถ้ามี
    const [fks] = await conn.query(`
      SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role_id'
      AND REFERENCED_TABLE_NAME = 'roles'
    `);
    for (const fk of fks) {
      await conn.query(`ALTER TABLE users DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
    }

    // ─── Step 5: Seed Role "Super Admin" ──────────────────────────
    console.log('🌱  Seed Role Super Admin...');
    const [roleResult] = await conn.query(
      'INSERT INTO roles (name, display_name, permissions, is_system) VALUES (?, ?, ?, ?)',
      ['super_admin', 'Super Admin', JSON.stringify(SUPER_ADMIN_PERMISSIONS), 1]
    );
    const superAdminRoleId = roleResult.insertId;
    console.log(`   ✅ สร้าง Role "Super Admin" (id: ${superAdminRoleId}) สำเร็จ\n`);

    // ─── Step 6: เพิ่ม FK constraint ──────────────────────────────
    await conn.query(`
      ALTER TABLE users 
      ADD CONSTRAINT fk_users_role_id 
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE
    `);
    console.log('🔗  เพิ่ม FK constraint ระหว่าง users.role_id -> roles.id แล้ว\n');

    // ─── Step 7: Seed User "test/123456" ──────────────────────────
    console.log('👤  Seed User test/123456...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    await conn.query(
      'INSERT INTO users (username, display_name, password, role_id, is_active, is_deleted) VALUES (?, ?, ?, ?, 1, 0)',
      ['test', 'Super Admin (Temp)', hashedPassword, superAdminRoleId]
    );
    console.log('   ✅ สร้าง User test/123456 สำเร็จ\n');

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('🎉 Migration สำเร็จทั้งหมด!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 สรุป:');
    console.log('   - ล้างข้อมูล leads, followups, users, audit_logs แล้ว');
    console.log('   - สร้างตาราง roles แล้ว');
    console.log('   - แก้โครงสร้าง users ให้ใช้ role_id แล้ว');
    console.log('   - Role "Super Admin" (id: 1) ถูกสร้างแล้ว');
    console.log('   - User: test | Password: 123456 พร้อมใช้งาน');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.error('❌ Migration ล้มเหลว:', err.message);
    throw err;
  } finally {
    conn.release();
    process.exit();
  }
}

run();
