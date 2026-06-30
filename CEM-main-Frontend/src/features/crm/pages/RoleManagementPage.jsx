// pages/RoleManagementPage.jsx
// ==========================================
// หน้าจัดการ Role ทั้งหมด — ดู/สร้าง/แก้ไข/ลบ
// ==========================================
import React, { useState, useEffect } from 'react';
import RolePermissionForm from '../components/RolePermissionForm.jsx';
import { fetchRoles, createRoleApi, updateRoleApi, deleteRoleApi } from '../services/roleService.js';

const styles = {
  container: { padding: 28 },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: '#1e293b' },
  subtitle: { margin: '4px 0 0', fontSize: 13, color: '#64748b' },
  btnCreate: {
    padding: '10px 20px', background: '#6366f1', color: '#fff',
    border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer',
    fontSize: 14, display: 'flex', alignItems: 'center', gap: 6
  },
  card: {
    background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
    overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    padding: '12px 16px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0',
    textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 12
  },
  td: {
    padding: '14px 16px', borderBottom: '1px solid #f1f5f9',
    color: '#374151', verticalAlign: 'middle'
  },
  systemBadge: {
    display: 'inline-block', padding: '2px 8px',
    background: '#fef3c7', color: '#92400e',
    borderRadius: 12, fontSize: 11, fontWeight: 600
  },
  roleName: { fontWeight: 600, color: '#1e293b' },
  roleKey: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  userCount: { fontWeight: 600, color: '#6366f1' },
  btnEdit: {
    padding: '6px 14px', background: '#e0e7ff', color: '#4338ca',
    border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12
  },
  btnDelete: {
    padding: '6px 14px', background: '#fee2e2', color: '#b91c1c',
    border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12
  },
  actions: { display: 'flex', gap: 8 },
  empty: { padding: 40, textAlign: 'center', color: '#94a3b8' },
  loading: { padding: 40, textAlign: 'center', color: '#94a3b8' },
  errorMsg: {
    margin: '0 0 16px', padding: '12px 16px',
    background: '#fee2e2', color: '#b91c1c', borderRadius: 8,
    fontSize: 13, fontWeight: 500
  },
};

const RoleManagementPage = ({ currentUser }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const canCreate = currentUser?.role_is_system || currentUser?.permissions?.roles?.create;
  const canUpdate = currentUser?.role_is_system || currentUser?.permissions?.roles?.update;
  const canDelete = currentUser?.role_is_system || currentUser?.permissions?.roles?.delete;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchRoles();
      setRoles(data);
    } catch (e) {
      setError('ไม่สามารถโหลดรายการ Role ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingRole(null); setFormOpen(true); };
  const openEdit = (role) => { setEditingRole(role); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditingRole(null); };

  const handleSave = async (formData) => {
    setIsSaving(true);
    setError('');
    try {
      if (editingRole) {
        await updateRoleApi(editingRole.id, formData);
      } else {
        await createRoleApi(formData);
      }
      closeForm();
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`ต้องการลบ Role "${role.display_name}" ใช่ไหม?\n\nการลบนี้ไม่สามารถยกเลิกได้`)) return;
    setError('');
    try {
      await deleteRoleApi(role.id);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'ไม่สามารถลบ Role ได้');
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>🔐 จัดการ Role & สิทธิ์การใช้งาน</h1>
          <p style={styles.subtitle}>สร้างและกำหนด Permission ของแต่ละ Role</p>
        </div>
        {canCreate && (
          <button style={styles.btnCreate} onClick={openCreate}>
            ➕ สร้าง Role ใหม่
          </button>
        )}
      </div>

      {/* Error */}
      {error && <p style={styles.errorMsg}>⚠️ {error}</p>}

      {/* Table */}
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>ชื่อที่แสดง</th>
              <th style={styles.th}>จำนวนผู้ใช้</th>
              <th style={styles.th}>ประเภท</th>
              <th style={styles.th}>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} style={styles.loading}>⏳ กำลังโหลด...</td></tr>
            )}
            {!loading && roles.length === 0 && (
              <tr><td colSpan={5} style={styles.empty}>ยังไม่มี Role ในระบบ</td></tr>
            )}
            {!loading && roles.map((role, idx) => (
              <tr key={role.id} style={idx % 2 === 1 ? { background: '#f8fafc' } : {}}>
                <td style={styles.td}>
                  <div style={styles.roleName}>{role.display_name}</div>
                  <div style={styles.roleKey}>{role.name}</div>
                </td>
                <td style={styles.td}>{role.display_name}</td>
                <td style={styles.td}>
                  <span style={styles.userCount}>{role.user_count || 0} คน</span>
                </td>
                <td style={styles.td}>
                  {role.is_system ? (
                    <span style={styles.systemBadge}>⭐ System</span>
                  ) : (
                    <span style={{ color: '#64748b', fontSize: 12 }}>Custom</span>
                  )}
                </td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    {canUpdate && (
                      <button style={styles.btnEdit} onClick={() => openEdit(role)}>
                        ✏️ แก้ไข
                      </button>
                    )}
                    {canDelete && (
                      <button style={styles.btnDelete} onClick={() => handleDelete(role)}>
                        🗑️ ลบ
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permission Form Modal */}
      {formOpen && (
        <RolePermissionForm
          role={editingRole}
          onSave={handleSave}
          onClose={closeForm}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default RoleManagementPage;
