import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { RG } from '../constants/theme';
import { fetchRoleById, createRoleApi, updateRoleApi } from '../services/roleService';
import { ChevronLeft } from 'lucide-react';

// ─── สร้าง permissions object เริ่มต้น ──────────────────────────────────────
const buildDefaultPermissions = (existing = {}) => {
  return {
    dashboard: {
      menu: true,
      view: existing?.dashboard?.view || 'own',
      export: existing?.dashboard?.export || 'none',
    },
    leads: {
      menu: true,
      view: existing?.leads?.view || 'own',
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
      export: existing?.reports?.export || 'none',
      table_today: existing?.reports?.table_today !== undefined ? existing?.reports?.table_today : true,
      table_performance: existing?.reports?.table_performance !== undefined ? existing?.reports?.table_performance : true,
      table_stage: existing?.reports?.table_stage !== undefined ? existing?.reports?.table_stage : true,
      table_filtered: existing?.reports?.table_filtered !== undefined ? existing?.reports?.table_filtered : true,
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
  container: { background: RG.surface, padding: 24, borderRadius: 12, boxShadow: RG.shadowSoft },
  header: {
    display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${RG.border}`
  },
  title: { margin: 0, fontSize: 18, fontWeight: 700, color: RG.text },
  body: { display: 'flex', flexDirection: 'column', gap: 16 },
  footer: {
    paddingTop: 24, marginTop: 24, borderTop: `1px solid ${RG.border}`,
    display: 'flex', justifyContent: 'flex-start', gap: 10
  },
  inputGroup: { marginBottom: 12 },
  label: { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: RG.text },
  input: {
    width: '100%', padding: '9px 12px', border: `1px solid ${RG.border}`,
    borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box'
  },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 },
  
  card: {
    border: '1px solid #b2ebf2', borderRadius: 8, padding: '16px 20px',
    background: RG.surface, position: 'relative'
  },
  cardTitle: {
    color: RG.primary, fontSize: 16, fontWeight: 700, margin: '0 0 16px 0'
  },
  row: { display: 'flex', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 16 },
  rowLabel: { width: 60, fontWeight: 600, color: RG.text, fontSize: 14 },
  radioLabel: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 },
  checkbox: { width: 16, height: 16, accentColor: RG.primary, cursor: 'pointer' },
  radio: { width: 16, height: 16, accentColor: RG.primary, cursor: 'pointer' },
  divider: { height: 1, background: '#b2ebf2', borderStyle: 'dashed', margin: '16px 0', borderTop: '1px dashed #b2ebf2' },
  
  treeLine: { borderLeft: '2px dashed #cbd5e1', paddingLeft: 16, marginLeft: 6, marginTop: 8 },
  treeItem: { display: 'flex', alignItems: 'center', gap: 8, position: 'relative', marginBottom: 8 },
  treeCorner: {
    position: 'absolute', left: -16, top: -8, width: 12, height: 16,
    borderBottom: '2px dashed #cbd5e1', borderLeft: '2px dashed #cbd5e1'
  },

  btnPrimary: {
    padding: '9px 24px', background: RG.primary, color: RG.surface,
    border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14
  },
  btnSecondary: {
    padding: '9px 24px', background: '#f1f5f9', color: RG.text,
    border: `1px solid ${RG.border}`, borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14
  },
  backBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: RG.textMuted, display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: 6
  }
};

const RoleFormPage = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [permissions, setPermissions] = useState(buildDefaultPermissions());

  useEffect(() => {
    if (id) {
      loadRole(id);
    }
  }, [id]);

  const loadRole = async (roleId) => {
    setLoading(true);
    try {
      const data = await fetchRoleById(roleId);
      setName(data.name || '');
      setDisplayName(data.display_name || '');
      
      let parsedPerms = data.permissions;
      if (typeof parsedPerms === 'string') {
        try { parsedPerms = JSON.parse(parsedPerms); } catch(e){}
      }
      setPermissions(buildDefaultPermissions(parsedPerms));
    } catch (e) {
      toast.error('ไม่สามารถโหลดข้อมูล Role ได้');
      navigate('/role_management');
    } finally {
      setLoading(false);
    }
  };

  const setPerm = (page, key, value) => {
    setPermissions(prev => ({
      ...prev,
      [page]: { ...prev[page], [key]: value }
    }));
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error('กรุณากรอกชื่อ Role');
    if (!displayName.trim()) return toast.error('กรุณากรอกชื่อที่แสดง');
    
    setIsSaving(true);
    const formData = { name: name.trim(), display_name: displayName.trim(), permissions };
    
    try {
      if (id) {
        await updateRoleApi(id, formData);
        toast.success('แก้ไข Role สำเร็จ');
      } else {
        await createRoleApi(formData);
        toast.success('สร้าง Role สำเร็จ');
      }
      navigate('/role_management');
    } catch (e) {
      toast.error(e.response?.data?.error || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: RG.textMuted }}>⏳ กำลังโหลด...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/role_management')}>
          <ChevronLeft size={20} /> กลับ
        </button>
        <h2 style={styles.title}>{id ? `แก้ไข Role: ${displayName || name}` : 'สร้าง Role ใหม่'}</h2>
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
                    <label style={{ ...styles.checkboxLabel, color: permissions.leads.create ? RG.text : RG.textMuted }}>
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
                  <label style={{ ...styles.checkboxLabel, color: permissions.leads.view_owner ? RG.text : RG.textMuted }}>
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
            <div style={styles.divider}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: RG.text, marginBottom: 4 }}>สิทธิ์การเห็นตารางรายงาน (Visible Tables):</div>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" style={styles.checkbox} checked={permissions.reports.table_today} onChange={e => setPerm('reports', 'table_today', e.target.checked)} /> รายงานการติดตาม / ติดต่อวันนี้ (Today's Log)
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" style={styles.checkbox} checked={permissions.reports.table_performance} onChange={e => setPerm('reports', 'table_performance', e.target.checked)} /> ผลงานรายบุคคล (Sales Performance)
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" style={styles.checkbox} checked={permissions.reports.table_stage} onChange={e => setPerm('reports', 'table_stage', e.target.checked)} /> สรุปตาม Stage (Pipeline by Stage)
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" style={styles.checkbox} checked={permissions.reports.table_filtered} onChange={e => setPerm('reports', 'table_filtered', e.target.checked)} /> รายชื่อลูกค้าตามตัวกรอง (Filtered Leads List)
              </label>
            </div>
          </div>
        </div>

        {/* Other Basic Permissions (Roles, Users) - Always visible */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8, background: RG.background, borderRadius: 8, border: `1px solid ${RG.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: RG.text }}>สิทธิ์ขั้นสูง (Roles & Users Management)</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 14, color: RG.text }}>
            <strong style={{ width: 140 }}>Role Management:</strong>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" style={{ width: 16, height: 16, accentColor: RG.primary, cursor: 'pointer' }} checked={permissions.roles.menu} onChange={e => { setPerm('roles', 'menu', e.target.checked); setPerm('roles', 'view', e.target.checked); }} /> View</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" style={{ width: 16, height: 16, accentColor: RG.primary, cursor: 'pointer' }} checked={permissions.roles.create} onChange={e => setPerm('roles', 'create', e.target.checked)} /> Create</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" style={{ width: 16, height: 16, accentColor: RG.primary, cursor: 'pointer' }} checked={permissions.roles.update} onChange={e => setPerm('roles', 'update', e.target.checked)} /> Edit</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" style={{ width: 16, height: 16, accentColor: RG.primary, cursor: 'pointer' }} checked={permissions.roles.delete} onChange={e => setPerm('roles', 'delete', e.target.checked)} /> Delete</label>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 14, color: RG.text }}>
            <strong style={{ width: 140 }}>User Management:</strong>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" style={{ width: 16, height: 16, accentColor: RG.primary, cursor: 'pointer' }} checked={permissions.users.menu} onChange={e => { setPerm('users', 'menu', e.target.checked); setPerm('users', 'view', e.target.checked); }} /> View</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" style={{ width: 16, height: 16, accentColor: RG.primary, cursor: 'pointer' }} checked={permissions.users.create} onChange={e => setPerm('users', 'create', e.target.checked)} /> Create</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" style={{ width: 16, height: 16, accentColor: RG.primary, cursor: 'pointer' }} checked={permissions.users.update} onChange={e => setPerm('users', 'update', e.target.checked)} /> Edit</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" style={{ width: 16, height: 16, accentColor: RG.primary, cursor: 'pointer' }} checked={permissions.users.delete} onChange={e => setPerm('users', 'delete', e.target.checked)} /> Delete</label>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button style={styles.btnPrimary} onClick={handleSave} disabled={isSaving}>
          {isSaving ? '⏳ กำลังบันทึก...' : 'บันทึกสิทธิ์การใช้งาน'}
        </button>
        <button style={styles.btnSecondary} onClick={() => navigate('/role_management')}>
          ยกเลิก
        </button>
      </div>
    </div>
  );
};

export default RoleFormPage;
