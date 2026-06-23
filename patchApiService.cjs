const fs = require('fs');
let code = fs.readFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/services/apiService.js', 'utf8');

const newFunc = `
export const fetchMasterLeads = async (password) => {
  const { data } = await api.post("/leads/all", { password });
  return data;
};
`;

if (!code.includes('fetchMasterLeads')) {
  code = code.replace('// ---------------- Leads ----------------', '// ---------------- Leads ----------------\n' + newFunc);
  fs.writeFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/services/apiService.js', code);
  console.log('Added fetchMasterLeads to apiService');
}
