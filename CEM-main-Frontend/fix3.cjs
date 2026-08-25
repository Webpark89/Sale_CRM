const fs = require('fs');

let f3 = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/components/modals/FilterModal.jsx';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(
  /border: `1\.5px solid \${isActive \? sColor : RG\.border}`/g,
  `border: \`1.5px solid \${isActive ? RG.border : RG.border}\``
).replace(
  /background: isActive \? sColor \+ "22" : RG\.surface/g,
  `background: isActive ? "#F1F5F9" : RG.surface`
).replace(
  /color: isActive \? RG\.primary : RG\.textMuted/g,
  `color: isActive ? RG.text : RG.textMuted`
);
fs.writeFileSync(f3, c3);
console.log('FilterModal fixed again');
