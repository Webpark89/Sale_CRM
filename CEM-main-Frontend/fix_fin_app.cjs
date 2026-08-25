const fs = require('fs');
let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update finFilters initialization
content = content.replace(
  /const \[finFilters, setFinFilters\] = useState\(\{\r?\n\s*revenue: \{ min: "", max: "" \},\r?\n\s*registeredCapital: \{ min: "", max: "" \},\r?\n\s*profit: \{ min: "", max: "" \}\r?\n\s*\}\);/,
  `const [finFilters, setFinFilters] = useState({
      revenue: { min: "", max: "" },
      registeredCapital: { min: "", max: "" },
      profit: { min: "", max: "" },
      dealValue: { min: "", max: "" }
    });`
);

// 2. Add dealValue checks in filter
content = content.replace(
  /if \(finFilters\.profit\.max && Number\(l\.profit \|\| 0\) > Number\(finFilters\.profit\.max\)\) return false;/,
  `if (finFilters.profit.max && Number(l.profit || 0) > Number(finFilters.profit.max)) return false;
        if (finFilters.dealValue && finFilters.dealValue.min && Number(l.dealValue || 0) < Number(finFilters.dealValue.min)) return false;
        if (finFilters.dealValue && finFilters.dealValue.max && Number(l.dealValue || 0) > Number(finFilters.dealValue.max)) return false;`
);

fs.writeFileSync(file, content);
console.log('App.jsx finFilters dealValue patched');
