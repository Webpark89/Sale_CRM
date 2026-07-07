const axios = require('axios');

async function test() {
  try {
    const api = axios.create({
      baseURL: 'http://localhost:3001/api',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // We need to login to get a token.
    const loginRes = await api.post('/auth/login', { username: 'superadmin', password: '123456' });
    const token = loginRes.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const me = await api.get('/auth/me');
    console.log("Logged in as:", me.data.username, "ID:", me.data.id);

    // Get all leads
    const leadsRes = await api.post('/leads/all');
    const leads = leadsRes.data;
    if(leads.length === 0) {
      console.log("No leads to test with.");
      return;
    }
    
    // Pick the first lead
    const lead = leads[0];
    console.log(`Original lead ID: ${lead.id}, Owner: ${lead.ownerId}, Acknowledged: ${lead.isAcknowledged}`);

    // Reassign to someone else, e.g., 'crm1'. Let's find 'crm1' id.
    const usersRes = await api.get('/users');
    const crm1 = usersRes.data.find(u => u.username === 'crm1');
    if(!crm1) {
      console.log("crm1 not found");
      return;
    }

    console.log(`Reassigning to crm1 (ID: ${crm1.id})`);
    await api.put(`/leads/${lead.id}/reassign`, { owner_id: crm1.id });

    // Fetch leads again as crm1
    const loginCrm1Res = await api.post('/auth/login', { username: 'crm1', password: '123456' });
    const tokenCrm1 = loginCrm1Res.data.token;
    const apiCrm1 = axios.create({
      baseURL: 'http://localhost:3001/api',
      headers: {
        'Authorization': `Bearer ${tokenCrm1}`
      }
    });

    const leadsCrm1Res = await apiCrm1.get('/leads');
    const leadAfter = leadsCrm1Res.data.find(l => l.id === lead.id);
    console.log(`After reassign, fetched as crm1. Lead ID: ${leadAfter.id}, Owner: ${leadAfter.ownerId}, Acknowledged: ${leadAfter.isAcknowledged}`);
    
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
