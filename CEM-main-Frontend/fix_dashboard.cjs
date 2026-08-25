const fs = require('fs');
let file = 'd:/Sale_CRM/CEM-main-Frontend/src/features/crm/pages/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regexReduce = /const s=fl\.reduce\(\(a,l\)=>\{[\s\S]*?return a;\s*\},\{closed:0,won:0,lost:0,wonRev:0,activeRev:0,stale:0,need:0,sc:\{\}\}\);/;
const newReduce = `const s=fl.reduce((a,l)=>{
        if(l.stage==='Closed') {
          a.closed++;
          if(l.latestStatus==='Won'){a.won++; a.wonRev+=(Number(l.dealValue)||0);}
          else if(l.latestStatus==='Lost' || l.latestStatus==='Lost (Contact)' || l.latestStatus==='Lost (Closed)'){a.lost++;}
        } else {
          if(l.dealValue) a.activeRev+=(Number(l.dealValue)||0);
          if(l.nextFollowupDate && l.nextFollowupDate < td) a.stale++;
        }
        if(l.nextFollowupDate && l.nextFollowupDate === td && l.stage !== 'Closed') a.need++;
        if(l.stage) a.sc[l.stage]=(a.sc[l.stage]||0)+1;
        return a;
      },{closed:0,won:0,lost:0,wonRev:0,activeRev:0,stale:0,need:0,sc:{}});`;

content = content.replace(regexReduce, newReduce);

const regexKpi1 = /\{label:'ยอดเงิน Pipeline',value:activeRev>=1000000\?\(activeRev\/1000000\)\.toFixed\(1\)\+'M':activeRev>=1000\?\(activeRev\/1000\)\.toFixed\(1\)\+'k':activeRev,icon:CircleDollarSign,c:'#F59E0B'\}/;
const newKpi1 = `{label:'ยอดเงิน Pipeline',value:new Intl.NumberFormat('en-US').format(activeRev),icon:CircleDollarSign,c:'#F59E0B'}`;

const regexKpi2 = /\{label:'Stale \(>14วัน\)',value:stale,icon:AlertTriangle,c:'#ef4444'\}/;
const newKpi2 = `{label:'เลยกำหนดติดตาม',value:stale,icon:AlertTriangle,c:'#ef4444'}`;

content = content.replace(regexKpi1, newKpi1).replace(regexKpi2, newKpi2);

fs.writeFileSync(file, content);
console.log('Dashboard.jsx patched');
