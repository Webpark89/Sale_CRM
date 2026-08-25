const fs = require('fs');
const pagePath = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/AddLeadPage.jsx';
let content = fs.readFileSync(pagePath, 'utf8');

content = content.replace(
  /\/\/ Assuming you have a notify function in your project\nimport \{ notify \} from "\.\.\/\.\.\/\.\.\/utils\/notify";/,
  'import notify from "../../../../utils/toast";'
);

content = content.replace(/notify\?\./g, 'notify.');

fs.writeFileSync(pagePath, content);
console.log('AddLeadPage.jsx updated');
