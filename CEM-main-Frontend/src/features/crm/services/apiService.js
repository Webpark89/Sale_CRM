import api from "./api";

// ---------------- Leads ----------------

export const fetchLeads = async () => {
  const { data } = await api.get("/leads");
  return data;
};

export const fetchAllLeadsMaster = async () => {
  const { data } = await api.post("/leads/all");
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

// ---------------- User Management ----------------
export const fetchAllUsers = async () => {
  const { data } = await api.get("/users");
  return data;
};

export const createUserApi = async (userData) => {
  const { data } = await api.post("/users", userData);
  return data;
};

export const updateUserPasswordApi = async (id, username, password, display_name) => {
  const res = await api.put(`/users/${id}/password`, { username, password, display_name });
  return res.data;
};

export const updateUserRoleApi = async (id, role_id) => {
  const { data } = await api.put(`/users/${id}/role`, { role_id });
  return data;
};

export const toggleUserActiveApi = async (id, is_active, adminPassword) => {
  const { data } = await api.patch(`/users/${id}/active`, { is_active, adminPassword });
  return data;
};

export const deleteUserApi = async (id, adminPassword) => {
  const { data } = await api.delete(`/users/${id}`, { data: { adminPassword } });
  return data;
};

export const restoreUserApi = async (id, adminPassword) => {
  const { data } = await api.post(`/users/${id}/restore`, { adminPassword });
  return data;
};

export const updateUserPermissionsApi = async (id, permissions) => {
  const { data } = await api.put(`/users/${id}/permissions`, { permissions });
  return data;
};

// ---------------- Team Management ----------------
export const fetchTeamStatsApi = async () => {
  const { data } = await api.get("/leads/team/stats");
  return data;
};

export const reassignLeadApi = async (leadId, newOwnerId) => {
  const { data } = await api.put(`/leads/${leadId}/reassign`, { owner_id: newOwnerId });
  return data;
};

export const bulkReassignLeadsApi = async (fromOwnerId, toOwnerId) => {
  const { data } = await api.put("/leads/team/bulk-reassign", { from_owner_id: fromOwnerId, to_owner_id: toOwnerId });
  return data;
};
