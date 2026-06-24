import api from "./api";

// ---------------- Leads ----------------

export const fetchLeads = async () => {
  const { data } = await api.get("/leads");
  return data;
};

export const fetchAllLeadsMaster = async (password) => {
  const { data } = await api.post("/leads/all", { password });
  return data;
};

export const addLeadToApi = async (leadData) => {
  const { data } = await api.post("/leads", leadData);
  return data;
};

export const updateLeadToApi = async (id, leadData) => {
  const { data } = await api.put(`/leads/${id}`, leadData);
  return data;
};

export const deleteLeadFromApi = async (id) => {
  const { data } = await api.delete(`/leads/${id}`);
  return data;
};

export const deleteMultipleLeadsFromApi = async (ids) => {
  const { data } = await api.delete("/leads/bulk", { data: { ids } });
  return data;
};

export const restoreLeadsApi = async (ids) => {
  const { data } = await api.post("/leads/restore", { ids });
  return data;
};

export const hardDeleteLeadApi = async (id) => {
  const { data } = await api.delete(`/leads/${id}/hard`);
  return data;
};

export const toggleLeadStarApi = async (id) => {
  const { data } = await api.patch(`/leads/${id}/star`);
  return data;
};

// ---------------- Followups ----------------
export const fetchAllFollowups = async () => {
  const { data } = await api.get("/followups");
  return data;
};

export const fetchFollowupsByLead = async (leadId) => {
  const { data } = await api.get(`/leads/${leadId}/followups`);
  return data;
};

export const addFollowupToApi = async (leadId, followupData) => {
  const { data } = await api.post(`/leads/${leadId}/followups`, followupData);
  return data; // { followup: {}, lead: {} }
};

export const markFollowupDoneApi = async (fupId, is_done) => {
  const { data } = await api.put(`/followups/${fupId}/done`, { is_done });
  return data;
};

export const deleteFollowupApi = async (fupId) => {
  const { data } = await api.delete(`/followups/${fupId}`);
  return data;
};
