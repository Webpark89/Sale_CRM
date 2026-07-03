// RolePermissionForm.jsx
// ==========================================
// Form สร้าง/แก้ไข Role พร้อม Permission UI ตามแบบ
// ==========================================
import React, { useState } from 'react';
import toast from 'react-hot-toast';

// ─── สร้าง permissions object เริ่มต้น ──────────────────────────────────────
const buildDefaultPermissions = (existing = {}) => {
  return {
    dashboard: {
      menu: true,
      view: existing?.dashboard?.view || 'own',
      view_select: existing?.dashboard?.view_select || false,
      export: existing?.dashboard?.export || 'none',
    },
    leads: {
      menu: true,
      view: existing?.leads?.view || 'own',
      view_select: existing?.leads?.view_select || false,
      export: existing?.leads?.export || 'none',
      create: existing?.leads?.create || false,
      assign: existing?.leads?.assign || false,
      edit: existing?.leads?.edit || false,
      delete: existing?.leads?.delete || false,
      view_owner: existing?.leads?.view_owner || false,
      reassign: existing?.leads?.reassign || false,
    },
    reports: {
      menu: true,
      view: existing?.reports?.view || 'own',
      view_select: existing?.reports?.view_select || false,
      export: existing?.reports?.export || 'none',
    },
    roles: {
      menu: existing?.roles?.menu || false,
      view: existing?.roles?.view || false,
      create: existing?.roles?.create || false,
      update: existing?.roles?.update || false,
      delete: existing?.roles?.delete || false,
    },
    users: {
      menu: existing?.users?.menu || false,
      view: existing?.users?.view || false,
      create: existing?.users?.create || false,
      update: existing?.users?.update || false,
      delete: existing?.users?.delete || false,
    }
  };
};

// ─── CSS Styles ──────────────────────────────────────────────────────────────
const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20
  },
  modal: {
    background: '#fff', borderRadius: 12, width: '100%', maxWidth: 1100,
    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  header: {
    padding: '16px 24px', background: '#0fa9a8', color: '#fff',
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  title: { margin: 0, fontSize: 18, fontWeight: 700 },
  body: { padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 },
  footer: {
    padding: '16px 24px', borderTop: '1px solid #e2e8f0',
    display: 'flex', justifyContent: 'flex-end', gap: 10
  },
  inputGroup: { marginBottom: 12 },
  label: { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' },
  input: {
    width: '100%', padding: '9px 12px', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box'
  },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
  
  card: {
    border: '1px solid #b2ebf2', borderRadius: 8, padding: '16px 20px',
    background: '#fff', position: 'relative'
  },
  cardTitle: {
    color: '#0fa9a8', fontSize: 16, fontWeight: 700, margin: '0 0 16px 0'
  },
  row: { display: 'flex', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 16 },
  rowLabel: { width: 60, fontWeight: 600, color: '#1e293b', fontSize: 14 },
  radioLabel: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 },
  checkbox: { width: 16, height: 16, accentColor: '#0fa9a8', cursor: 'pointer' },
  radio: { width: 16, height: 16, accentColor: '#0fa9a8', cursor: 'pointer' },
  divider: { height: 1, background: '#b2ebf2', borderStyle: 'dashed', margin: '16px 0', borderTop: '1px dashed #b2ebf2' },
  
  treeLine: { borderLeft: '2px dashed #cbd5e1', paddingLeft: 16, marginLeft: 6, marginTop: 8 },
  treeItem: { display: 'flex', alignItems: 'center', gap: 8, position: 'relative', marginBottom: 8 },
  treeCorner: {
    position: 'absolute', left: -16, top: -8, width: 12, height: 16,
    borderBottom: '2px dashed #cbd5e1', borderLeft: '2px dashed #cbd5e1'
  },

  btnPrimary: {
    padding: '9px 20px', background: '#0fa9a8', color: '#fff',
    border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14
  },
  btnSecondary: {
    padding: '9px 20px', background: '#f1f5f9', color: '#374151',
    border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 24, cursor: 'pointer',
    color: '#fff', lineHeight: 1
  }
};

const RolePermissionForm = ({ role = null, onSave, onClose, isSaving = false }) => {
  const [name, setName] = useState(role?.name || '');
  const [displayName, setDisplayName] = useState(role?.display_name || '');
  const [permissions, setPermissions] = useState(buildDefaultPermissions(role?.permissions));

  const setPerm = (page, key, value) => {
    setPermissions(prev => ({
      ...prev,
      [page]: { ...prev[page], [key]: value }
    }));
  };

  const handleSave = () => {
    if (!name.trim()) return toast.error('กรุณากรอกชื่อ Role');
    if (!displayName.trim()) return toast.error('กรุณากรอกชื่อที่แสดง');
    onSave({ name: name.trim(), display_name: displayName.trim(), permissions });
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>จัดการ Permission: {role ? `${role.display_name} (${role.name})` : name || 'Role ใหม่'}</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {/* ชื่อ Role */}
          <div style={styles.row2}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>ชื่อ Role (ภาษาอังกฤษ)</label>
              <input
                style={styles.input}
                value={name}
                onChange={e => setName(e.target.value.replace(/\s/g, '_').toLowerCase())}
                placeholder="เช่น admin"
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>ชื่อที่แสดง</label>
              <input
                style={styles.input}
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="เช่น ผู้ดูแลระบบ"
              />
            </div>
          </div>

          {/* Permissions Grid */}
          <div style={styles.grid3}>
            {/* Leads */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Leads</h3>
              <div style={styles.row}>
                <div style={styles.rowLabel}>View:</div>
                <label style={styles.radioLabel}>
                  <input type="radio" style={styles.radio} name="lead_view" checked={permissions.leads.view === 'own'} onChange={() => setPerm('leads', 'view', 'own')} /> Own
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" style={styles.radio} name="lead_view" checked={permissions.leads.view === 'all'} onChange={() => setPerm('leads', 'view', 'all')} /> All
                </label>
                <label style={{ ...styles.checkboxLabel, marginLeft: 20 }}>
                  <input type="checkbox" style={styles.checkbox} checked={permissions.leads.view_select} onChange={e => setPerm('leads', 'view_select', e.target.checked)} /> Select Saler (Dropdown)
                </label>
              </div>
              <div style={styles.row}>
                <div style={styles.rowLabel}>Export:</div>
                <label style={styles.radioLabel}>
                  <input type="radio" style={styles.radio} name="lead_exp" checked={permissions.leads.export === 'none'} onChange={() => setPerm('leads', 'export', 'none')} /> None
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" style={styles.radio} name="lead_exp" checked={permissions.leads.export === 'own'} onChange={() => setPerm('leads', 'export', 'own')} /> Own
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" style={styles.radio} name="lead_exp" checked={permissions.leads.export === 'all'} onChange={() => setPerm('leads', 'export', 'all')} /> All
                </label>
              </div>

              <div style={styles.divider}></div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" style={styles.checkbox} checked={permissions.leads.create} onChange={e => {
                      setPerm('leads', 'create', e.target.checked);
                      if (!e.target.checked) setPerm('leads', 'assign', false);
                    }} /> Create Lead
                  </label>
                  {/* Child of Create Lead */}
                  <div style={styles.treeLine}>
                    <div style={styles.treeItem}>
                      <div style={styles.treeCorner}></div>
                      <label style={{ ...styles.checkboxLabel, color: permissions.leads.create ? '#1e293b' : '#94a3b8' }}>
                        <input type="checkbox" style={styles.checkbox} disabled={!permissions.leads.create} checked={permissions.leads.assign} onChange={e => setPerm('leads', 'assign', e.target.checked)} /> Assign Lead
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" style={styles.checkbox} checked={permissions.leads.edit} onChange={e => setPerm('leads', 'edit', e.target.checked)} /> Edit
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input type="checkbox" style={styles.checkbox} checked={permissions.leads.delete} onChange={e => setPerm('leads', 'delete', e.target.checked)} /> Delete
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={styles.checkboxLabel}>
                  <input type="checkbox" style={styles.checkbox} checked={permissions.leads.view_owner} onChange={e => {
                    setPerm('leads', 'view_owner', e.target.checked);
                    if (!e.target.checked) setPerm('leads', 'reassign', false);
                  }} /> View Sales Owner
                </label>
                {/* Child of View Sales Owner */}
                <div style={styles.treeLine}>
                  <div style={styles.treeItem}>
                    <div style={styles.treeCorner}></div>
                    <label style={{ ...styles.checkboxLabel, color: permissions.leads.view_owner ? '#1e293b' : '#94a3b8' }}>
                      <input type="checkbox" style={styles.checkbox} disabled={!permissions.leads.view_owner} checked={permissions.leads.reassign} onChange={e => setPerm('leads', 'reassign', e.target.checked)} /> Reassign (โอนย้าย)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Dashboard</h3>
              <div style={styles.row}>
                <div style={styles.rowLabel}>View:</div>
                <label style={styles.radioLabel}>
                  <input type="radio" style={styles.radio} name="dash_view" checked={permissions.dashboard.view === 'own'} onChange={() => setPerm('dashboard', 'view', 'own')} /> Own
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" style={styles.radio} name="dash_view" checked={permissions.dashboard.view === 'all'} onChange={() => setPerm('dashboard', 'view', 'all')} /> All
                </label>
                <label style={{ ...styles.checkboxLabel, marginLeft: 20 }}>
                  <input type="checkbox" style={styles.checkbox} checked={permissions.dashboard.view_select} onChange={e => setPerm('dashboard', 'view_select', e.target.checked)} /> Select Saler (Dropdown)
                </label>
              </div>
              <div style={styles.row}>
                <div style={styles.rowLabel}>Export:</div>
                <label style={styles.radioLabel}>
                  <input type="radio" style={styles.radio} name="dash_exp" checked={permissions.dashboard.export === 'none'} onChange={() => setPerm('dashboard', 'export', 'none')} /> None
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" style={styles.radio} name="dash_exp" checked={permissions.dashboard.export === 'own'} onChange={() => setPerm('dashboard', 'export', 'own')} /> Own
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" style={styles.radio} name="dash_exp" checked={permissions.dashboard.export === 'all'} onChange={() => setPerm('dashboard', 'export', 'all')} /> All
                </label>
              </div>
            </div>

            {/* Reports */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Reports</h3>
              <div style={styles.row}>
                <div style={styles.rowLabel}>View:</div>
                <label style={styles.radioLabel}>
                  <input type="radio" style={styles.radio} name="rep_view" checked={permissions.reports.view === 'own'} onChange={() => setPerm('reports', 'view', 'own')} /> Own
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" style={styles.radio} name="rep_view" checked={permissions.reports.view === 'all'} onChange={() => setPerm('reports', 'view', 'all')} /> All
                </label>
                <label style={{ ...styles.checkboxLabel, marginLeft: 20 }}>
                  <input type="checkbox" style={styles.checkbox} checked={permissions.reports.view_select} onChange={e => setPerm('reports', 'view_select', e.target.checked)} /> Select Saler (Dropdown)
                </label>
              </div>
              <div style={styles.row}>
                <div style={styles.rowLabel}>Export:</div>
                <label style={styles.radioLabel}>
                  <input type="radio" style={styles.radio} name="rep_exp" checked={permissions.reports.export === 'none'} onChange={() => setPerm('reports', 'export', 'none')} /> None
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" style={styles.radio} name="rep_exp" checked={permissions.reports.export === 'own'} onChange={() => setPerm('reports', 'export', 'own')} /> Own
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" style={styles.radio} name="rep_exp" checked={permissions.reports.export === 'all'} onChange={() => setPerm('reports', 'export', 'all')} /> All
                </label>
              </div>
            </div>
          </div>

          {/* Other Basic Permissions (Roles, Users) - Hidden but maintained in state */}
          <details style={{ cursor: 'pointer', color: '#64748b', fontSize: 14 }}>
            <summary>สิทธิ์ขั้นสูง (Roles & Users Management)</summary>
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <strong>Role Management:</strong>
                <label><input type="checkbox" checked={permissions.roles.menu} onChange={e => { setPerm('roles', 'menu', e.target.checked); setPerm('roles', 'view', e.target.checked); }} /> เข้าถึง (ดูข้อมูล)</label>
                <label><input type="checkbox" checked={permissions.roles.create} onChange={e => setPerm('roles', 'create', e.target.checked)} /> สร้าง</label>
                <label><input type="checkbox" checked={permissions.roles.update} onChange={e => setPerm('roles', 'update', e.target.checked)} /> แก้ไข</label>
                <label><input type="checkbox" checked={permissions.roles.delete} onChange={e => setPerm('roles', 'delete', e.target.checked)} /> ลบ</label>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <strong>User Management:</strong>
                <label><input type="checkbox" checked={permissions.users.menu} onChange={e => { setPerm('users', 'menu', e.target.checked); setPerm('users', 'view', e.target.checked); }} /> เข้าถึง (ดูข้อมูล)</label>
                <label><input type="checkbox" checked={permissions.users.create} onChange={e => setPerm('users', 'create', e.target.checked)} /> สร้าง</label>
                <label><input type="checkbox" checked={permissions.users.update} onChange={e => setPerm('users', 'update', e.target.checked)} /> แก้ไข</label>
                <label><input type="checkbox" checked={permissions.users.delete} onChange={e => setPerm('users', 'delete', e.target.checked)} /> ลบ</label>
              </div>
            </div>
          </details>

        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.btnPrimary} onClick={handleSave} disabled={isSaving}>
            {isSaving ? '⏳ กำลังบันทึก...' : 'บันทึกสิทธิ์การใช้งาน'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionForm;
