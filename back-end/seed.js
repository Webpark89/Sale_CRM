const db = require("./config/db");
const bcrypt = require("bcryptjs");

async function seed() {
  try {
    console.log("Clearing data...");
    await db.query("SET FOREIGN_KEY_CHECKS = 0");
    await db.query("TRUNCATE TABLE followups");
    await db.query("TRUNCATE TABLE leads");
    await db.query("TRUNCATE TABLE audit_logs");
    
    // ลบ users ยกเว้น superadmin เผื่อเอาไว้เข้าสู่ระบบ
    await db.query("DELETE FROM users WHERE username != 'superadmin'"); 
    
    const [roles] = await db.query("SELECT * FROM roles");
    console.log("Roles found:", roles.map(r => r.name));

    // Create users for each role
    const users = [];
    const password = await bcrypt.hash("123456", 10);
    
    for (const role of roles) {
        if(role.name === 'superadmin') continue; 
        const username = `mock_${role.name.replace(/\s+/g, '_').toLowerCase()}`;
        const [res] = await db.execute(
            'INSERT INTO users (username, password, role_id, display_name, is_active, is_deleted) VALUES (?, ?, ?, ?, 1, 0)',
            [username, password, role.id, `Mock ${role.name}`]
        );
        users.push({ id: res.insertId, username, role: role.name });
    }
    
    // Also fetch superadmin to have as owner
    const [sa] = await db.query("SELECT id FROM users WHERE username = 'superadmin' LIMIT 1");
    if(sa.length > 0) {
        users.push({ id: sa[0].id, username: 'superadmin', role: 'superadmin' });
    }

    console.log(`Created ${users.length} mock users.`);

    // Generate 50 Leads
    const statuses = [
        "ติดต่อใหม่", 
        "ติดตามวันนี้", 
        "มีตติ้ง", 
        "ทำโปรไฟล์", 
        "ติดตาม", 
        "ติดต่อไม่ได้", 
        "ไม่สนใจ", 
        "ปิดการขาย"
    ];

    const companies = [
        "TechFlow", "CloudSync", "NextGen IT", "Global Solutions", "Apex Innovations", 
        "Pinnacle Corp", "Alpha Systems", "Omega Networks", "Quantum Dynamics", "Future State", 
        "Vanguard Holdings", "Silverline", "BlueSky Tech", "Horizon Solutions", "Summit Systems",
        "NexTech Services", "Visionary Partners", "BrightIdeas LLC", "DataCore", "Innova Solutions",
        "Prime Industries", "Velocity Concepts", "Evolve Digital", "Core Solutions", "Synergy Group",
        "Infinity Tech", "Nexus Corp", "AeroSystems", "Elevate Marketing", "Crescent Solutions"
    ];
    
    console.log("Generating 50 leads...");
    
    const leadIds = [];
    for(let i = 1; i <= 50; i++) {
        // สุ่ม owner จาก users ที่สร้างมา (รวม superadmin)
        const owner = users[Math.floor(Math.random() * users.length)];
        
        // สุ่มชื่อบริษัทให้ดูเหมือนจริง
        const company = companies[Math.floor(Math.random() * companies.length)] + (i > 30 ? ` ${i}` : '');
        
        // สุ่มตัวเลขเงิน
        const revenue = Math.floor(Math.random() * 5000000) + 100000;
        const registeredCap = Math.floor(Math.random() * 10000000) + 1000000;
        const profit = Math.floor(revenue * (0.1 + Math.random() * 0.3));

        const [res] = await db.execute(
            `INSERT INTO leads
             (owner_id, created_by, is_acknowledged, company_name, company_number, contact_name, contact_phone,
              contact_email, description, revenue, registered_capital, profit, is_deleted)
             VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
             [
                 owner.id, owner.id, company, `0${Math.floor(Math.random() * 9000000000000)}`, `คุณลูกค้าคนที่ ${i}`, `08${Math.floor(10000000 + Math.random() * 90000000)}`,
                 `contact${i}@${company.replace(/\s+/g, '').toLowerCase()}.com`, `ลูกค้าสนใจบริการระบบซอฟต์แวร์`, revenue,
                 registeredCap, profit
             ]
        );
        leadIds.push(res.insertId);
    }
    
    // Add followups to set statuses
    console.log("Adding followups for statuses...");
    for(let i = 0; i < leadIds.length; i++) {
        const leadId = leadIds[i];
        
        // กระจายสถานะให้ครบทุกอัน
        const status = statuses[i % statuses.length];
        
        let nextFollowup = null;
        if (status !== 'ปิดการขาย' && status !== 'ไม่สนใจ' && status !== 'ติดต่อไม่ได้') {
            // วันที่นัดถัดไป อาจจะเป็นเมื่อวาน วันนี้ หรือพรุ่งนี้
            const daysOffset = Math.floor(Math.random() * 7) - 2; // -2 ถึง +4
            nextFollowup = new Date(Date.now() + daysOffset * 86400000);
        }

        const dateStr = new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0];
        const nextFollowupStr = nextFollowup ? nextFollowup.toISOString().split('T')[0] : null;

        // Add a followup
        await db.execute(
            `INSERT INTO followups (lead_id, sequence, status, detail, contact_date, next_followup_date, completed)
             VALUES (?, 1, ?, ?, ?, ?, 0)`,
             [
                 leadId, status, `บันทึกการคุยล่าสุด: ลูกค้าอยู่ในสถานะ ${status}`, dateStr,
                 nextFollowupStr
             ]
        );
    }
    
    await db.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("✅ Mock data seeded successfully! 50 leads added.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
