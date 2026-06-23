const fs = require('fs');
let code = fs.readFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx', 'utf8');

const oldStr = `    try {
      const { followup: savedFup, lead: updatedLead } = await addFollowupToApi(leadId, fForm);
      const newFollowups = { 
        ...followups, 
        [leadId]: [...(followups[leadId] || []), savedFup] 
      };
      const newLeads = leads.map(l => l.id === leadId ? updatedLead : l);
      setLeads(newLeads);
      setFollowups(newFollowups);
      setSelectedLead(updatedLead);
    } catch(e) {`;

const newStr = `    try {
      const { followup: savedFup, lead: updatedLead } = await addFollowupToApi(leadId, fForm);
      const newFollowups = { 
        ...followups, 
        [leadId]: [...(followups[leadId] || []), savedFup] 
      };
      
      let finalLead = updatedLead;
      if (!finalLead) {
        const oldLead = leads.find(l => l.id === leadId);
        const allFups = newFollowups[leadId];
        const latestFup = allFups.reduce((a, b) => new Date(a.date || 0) > new Date(b.date || 0) ? a : b, savedFup);
        finalLead = {
          ...oldLead,
          latestStatus: latestFup.status,
          latestContactDate: latestFup.date,
          nextFollowupDate: latestFup.nextFollowupDate
        };
      }

      const newLeads = leads.map(l => l.id === leadId ? finalLead : l);
      setLeads(newLeads);
      setFollowups(newFollowups);
      setSelectedLead(finalLead);
    } catch(e) {`;

if (!code.includes(oldStr)) {
  console.log("Could not find oldStr in App.jsx");
  process.exit(1);
}

code = code.replace(oldStr, newStr);
fs.writeFileSync('D:/WebPark/Sale_CRM/CEM-main-Frontend/src/features/crm/App.jsx', code);
console.log('App.jsx updated via patch script');
