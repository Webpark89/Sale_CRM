const fs = require('fs');
const appPath = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

content = content.replace(
  /notify\.error\(err\);\r?\n\s*return;\r?\n\s*\}/g,
  'notify.error(err);\n      return false;\n    }'
);

content = content.replace(
  /pushAction\(\{ type: "ADD_LEAD".*\r?\n\s*notify\.success(.*);\r?\n\s*\} catch \(e\) \{/g,
  'pushAction({ type: "ADD_LEAD", payload: { id: newLead.id, data: newLead } });\n      notify.success$1;\n      return true;\n    } catch (e) {'
);

content = content.replace(
  /notify\.error\(e\.response\?\.data\?\.error \|\| (.*)\);\r?\n\s*\}/g,
  'notify.error(e.response?.data?.error || $1);\n      return false;\n    }'
);

fs.writeFileSync(appPath, content);
console.log('App.jsx fixed via regex 2');
