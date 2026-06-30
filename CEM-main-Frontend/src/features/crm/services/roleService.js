// services/roleService.js
// ==========================================
// Service สำหรับเรียก API เกี่ยวกับ Role
// ==========================================
import api from './api.js';

export const fetchRoles = async () => {
  const { data } = await api.get('/roles');
  return data;
};

export const fetchRoleById = async (id) => {
  const { data } = await api.get(`/roles/${id}`);
  return data;
};

export const createRoleApi = async (roleData) => {
  const { data } = await api.post('/roles', roleData);
  return data;
};

export const updateRoleApi = async (id, roleData) => {
  const { data } = await api.put(`/roles/${id}`, roleData);
  return data;
};

export const deleteRoleApi = async (id) => {
  const { data } = await api.delete(`/roles/${id}`);
  return data;
};
