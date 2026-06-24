const fs = require('fs');
let code = fs.readFileSync('D:/WebPark/Sale_CRM/back-end/controllers/leadController.js', 'utf8');
const newFunc = `
exports.getAllLeadsMaster = async (req, res) => {
  try {
    const { password } = req.body;
    if (password !== 'admin123') {
      return res.status(403).json({ error: 'รหัสกลางไม่ถูกต้อง' });
    }

    const query = baseLeadQuery + ' ORDER BY l.created_at DESC';
    const [rows] = await db.execute(query);
    res.json(rows.map(formatLead));
  } catch (err) {
    console.error('getAllLeadsMaster error:', err);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลรวมลีดได้' });
  }
};
`;
code += newFunc;
fs.writeFileSync('D:/WebPark/Sale_CRM/back-end/controllers/leadController.js', code);
console.log('leadController updated');
