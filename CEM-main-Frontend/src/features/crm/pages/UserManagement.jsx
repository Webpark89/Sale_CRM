import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { fetchAllUsers, createUserApi, updateUserPasswordApi, updateUserRoleApi, toggleUserActiveApi, deleteUserApi, restoreUserApi } from "../services/apiService";
import { fetchRoles } from "../services/roleService";
import { RG } from "../constants/theme";
import Btn from "../components/common/Btn";
import { inputStyle } from "../components/common/styles";
import Modal from "../components/common/Modal";

const getRoleBadgeStyle = () => {
  return {
    display: 'inline-block', 
    width: 140, 
    textAlign: 'center',
    padding: '6px 0', 
    borderRadius: 20, 
    fontSize: 13, 
    fontWeight: 700,
    background: RG.background,
    color: RG.text,
    border: `1px solid ${RG.border}`,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };
};

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", confirmPassword: "", display_name: "", role_id: "" });
  const [roles, setRoles] = useState([]);

  const [showEditUser, setShowEditUser] = useState(null);
  const [showChangePwd, setShowChangePwd] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(null); // stores user object
  const [adminPassword, setAdminPassword] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [deletedUserToast, setDeletedUserToast] = useState(null); // { id, username, adminPassword }
  const [toastTimeoutId, setToastTimeoutId] = useState(null);

  const [editRoleId, setEditRoleId] = useState("");

  // -- Pagination & Reassign Selection State --
  const [page, setPage] = useState(1);
  const perPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const u = await fetchAllUsers();
      setUsers(u);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchRoles().then(setRoles).catch(console.error);
  }, []);

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) return toast.error("กรุณากรอก Username และ Password");
    if (newUser.password !== newUser.confirmPassword) return toast.error("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
    if (!newUser.role_id) return toast.error("กรุณาเลือก Role (บทบาท) ให้กับผู้ใช้งาน");
    try {
      await createUserApi(newUser);
      setShowAddUser(false);
      setNewUser({ username: "", password: "", confirmPassword: "", display_name: "", role_id: roles[0]?.id || "" });
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) return toast.error("รหัสผ่านและการยืนยันรหัสผ่านไม่ถูกต้อง");
    try {
      await updateUserPasswordApi(showChangePwd.id, showChangePwd.username, newPassword, showChangePwd.display_name);
      setShowChangePwd(null);
      setNewPassword("");
      setConfirmPassword("");
      toast.success("อัปเดตรหัสผ่านสำเร็จ");
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  const handleEditUser = async () => {
    try {
      if (editRoleId && editRoleId !== showEditUser.role_id) {
        await updateUserRoleApi(showEditUser.id, editRoleId);
      }
      if (editUsername !== showEditUser.username || editDisplayName !== showEditUser.display_name) {
        await updateUserPasswordApi(showEditUser.id, editUsername, "", editDisplayName);
      }
      setShowEditUser(null);
      setEditUsername("");
      setEditDisplayName("");
      setEditRoleId("");
      toast.success("อัปเดตข้อมูลสำเร็จ");
      loadData();
    } catch (e) {
      toast.error(e.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  const handleToggleActive = async (user) => {
    if (!adminPassword) return toast.error("กรุณากรอกรหัสผ่าน Admin");
    try {
      await toggleUserActiveApi(user.id, !user.is_active, adminPassword);
      setShowStatusModal(null);
      setAdminPassword("");
      loadData();
      toast.success(user.is_active ? "ระงับบัญชีสำเร็จ" : "เปิดใช้งานบัญชีสำเร็จ");
    } catch (e) {
      toast.error(e.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!adminPassword) return toast.error("กรุณากรอกรหัสผ่าน Admin");
    try {
      await deleteUserApi(user.id, adminPassword);
      setShowStatusModal(null);
      setIsConfirmingDelete(false);
      loadData();
      
      // Show Undo Toast
      if (toastTimeoutId) clearTimeout(toastTimeoutId);
      setDeletedUserToast({ id: user.id, username: user.username, adminPassword });
      const timeoutId = setTimeout(() => setDeletedUserToast(null), 7000);
      setToastTimeoutId(timeoutId);
      
      setAdminPassword("");
    } catch (e) {
      toast.error(e.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  const handleUndoDelete = async () => {
    if (!deletedUserToast) return;
    try {
      await restoreUserApi(deletedUserToast.id, deletedUserToast.adminPassword);
      setDeletedUserToast(null);
      if (toastTimeoutId) clearTimeout(toastTimeoutId);
      loadData();
      toast.success(`กู้คืนบัญชีผู้ใช้ ${deletedUserToast.username} สำเร็จ`);
    } catch (e) {
      toast.error(e.response?.data?.error || "เกิดข้อผิดพลาดในการกู้คืน");
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await updateUserRoleApi(id, newRole);
      loadData();
    } catch (e) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };





  if (loading) return <div style={{ padding: 20 }}>กำลังโหลด...</div>;

  return (
    <div style={{ background: RG.surface, padding: 24, borderRadius: 12, boxShadow: RG.shadowSoft }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h3>จัดการทีม (User Management)</h3>
        <Btn onClick={() => setShowAddUser(true)}>+ เพิ่ม User ใหม่</Btn>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: RG.navbarBg, textAlign: "left" }}>

            <th style={{ padding: 12, borderBottom: `2px solid ${RG.border}` }}>Username</th>
            <th style={{ padding: 12, borderBottom: `2px solid ${RG.border}` }}>ชื่อที่แสดง</th>
            <th style={{ padding: 12, borderBottom: `2px solid ${RG.border}` }}>Role</th>
            <th style={{ padding: 12, borderBottom: `2px solid ${RG.border}` }}>สถานะ</th>
            <th style={{ padding: 12, borderBottom: `2px solid ${RG.border}` }}>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ borderBottom: `1px solid ${RG.border}` }}>

              <td style={{ padding: 12, fontWeight: "bold" }}>{u.username}</td>
              <td style={{ padding: 12 }}>{u.display_name || "-"}</td>
              <td style={{ padding: 12 }}>
                <span style={getRoleBadgeStyle(u.role_display_name || u.role_name, u.role_is_system)}>
                  {u.role_display_name || u.role_name || "-"}
                </span>
              </td>
              <td style={{ padding: 12 }}>
                <span style={{ color: u.is_active ? RG.success : RG.danger, fontWeight: "bold" }}>
                  {u.is_active ? "เปิดใช้งาน" : "ระงับ"}
                </span>
              </td>
              <td style={{ padding: 12 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn small variant="secondary" onClick={() => { setShowEditUser(u); setEditUsername(u.username); setEditDisplayName(u.display_name || ""); setEditRoleId(u.role_id || ""); }}>แก้ไขข้อมูลผู้ใช้</Btn>
                  {u.id !== currentUser.id && (
                    <Btn small variant={u.is_active ? "danger" : "warning"} onClick={() => setShowStatusModal(u)}>
                      สถานะ / ลบ
                    </Btn>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>



      {/* Modals */}
      {showAddUser && (
        <Modal title="เพิ่มผู้ใช้งานใหม่" onClose={() => setShowAddUser(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input placeholder="Username" style={inputStyle} value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
            <input placeholder="Password" type="password" style={inputStyle} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
            <input placeholder="ยืนยัน Password" type="password" style={inputStyle} value={newUser.confirmPassword} onChange={e => setNewUser({...newUser, confirmPassword: e.target.value})} />
            <input placeholder="ชื่อที่แสดง (Display Name)" style={inputStyle} value={newUser.display_name} onChange={e => setNewUser({...newUser, display_name: e.target.value})} />
            <select style={inputStyle} value={newUser.role_id} onChange={e => setNewUser({...newUser, role_id: e.target.value})}>
              <option value="">-- เลือก Role --</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.display_name} ({r.name})</option>
              ))}
            </select>
            <Btn onClick={handleAddUser}>สร้างผู้ใช้งาน</Btn>
          </div>
        </Modal>
      )}

      {showEditUser && (
        <Modal title="แก้ไขข้อมูลผู้ใช้" onClose={() => setShowEditUser(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: 14, fontWeight: "bold" }}>Username</label>
            <input placeholder="Username" style={inputStyle} value={editUsername} onChange={e => setEditUsername(e.target.value)} />
            
            <label style={{ fontSize: 14, fontWeight: "bold" }}>ชื่อที่แสดง (Display Name)</label>
            <input placeholder="ชื่อที่แสดง (Display Name)" style={inputStyle} value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} />

            <label style={{ fontSize: 14, fontWeight: "bold" }}>Role (บทบาท)</label>
            <select 
              style={inputStyle} 
              value={editRoleId} 
              onChange={e => setEditRoleId(e.target.value)}
            >
              <option value="">-- เลือก Role --</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.display_name} ({r.name})</option>
              ))}
            </select>
            
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Btn onClick={handleEditUser} style={{ flex: 1 }}>บันทึกข้อมูล</Btn>
              <Btn variant="secondary" onClick={() => { setShowChangePwd(showEditUser); setShowEditUser(null); setNewPassword(""); setConfirmPassword(""); }} style={{ flex: 1 }}>เปลี่ยนรหัสผ่าน</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showChangePwd && (
        <Modal title="เปลี่ยนรหัสผ่าน" onClose={() => setShowChangePwd(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: 14, fontWeight: "bold" }}>รหัสผ่านใหม่</label>
            <input placeholder="รหัสผ่านใหม่" type="password" style={inputStyle} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <label style={{ fontSize: 14, fontWeight: "bold" }}>ยืนยันรหัสผ่านใหม่</label>
            <input placeholder="ยืนยันรหัสผ่านใหม่" type="password" style={inputStyle} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            <Btn onClick={handleChangePassword} style={{ marginTop: 8 }}>บันทึกรหัสผ่าน</Btn>
          </div>
        </Modal>
      )}

      {showStatusModal && (
        <Modal title={`จัดการสถานะผู้ใช้: ${showStatusModal.username}`} onClose={() => { setShowStatusModal(null); setAdminPassword(""); setIsConfirmingDelete(false); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ margin: 0 }}>โปรดยืนยันรหัสผ่าน <strong>Admin ของคุณ</strong> ก่อนดำเนินการ</p>
            <input 
              placeholder="Admin Password" 
              type="password" 
              style={inputStyle} 
              value={adminPassword} 
              onChange={e => setAdminPassword(e.target.value)} 
            />
            {isConfirmingDelete ? (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginTop: 10 }}>
                <p style={{ margin: "0 0 10px 0", color: RG.danger, fontWeight: "bold" }}>⚠️ คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ {showStatusModal.username} ถาวร?</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn style={{ flex: 1 }} variant="danger" onClick={() => handleDeleteUser(showStatusModal)}>ยืนยันการลบถาวร</Btn>
                  <Btn style={{ flex: 1 }} variant="secondary" onClick={() => setIsConfirmingDelete(false)}>ยกเลิก</Btn>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <Btn 
                  style={{ flex: 1 }} 
                  variant={showStatusModal.is_active ? "warning" : "success"}
                  onClick={() => handleToggleActive(showStatusModal)}
                >
                  {showStatusModal.is_active ? "ระงับบัญชี" : "เปิดใช้งานบัญชี"}
                </Btn>
                <Btn 
                  style={{ flex: 1 }} 
                  variant="danger"
                  onClick={() => setIsConfirmingDelete(true)}
                >
                  ลบบัญชีถาวร
                </Btn>
              </div>
            )}
          </div>
        </Modal>
      )}




      {/* Undo Toast */}
      {deletedUserToast && (
        <div style={{
          position: 'fixed', bottom: 30, right: 30,
          background: '#333', color: RG.surface, padding: '12px 20px',
          borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 16, zIndex: 1000,
          fontFamily: "'Sarabun', sans-serif"
        }}>
          <span>ลบผู้ใช้ {deletedUserToast.username} สำเร็จ</span>
          <button 
            onClick={handleUndoDelete}
            style={{ 
              background: 'transparent', border: 'none', color: RG.primary, 
              fontWeight: 'bold', cursor: 'pointer', fontSize: 14 
            }}
          >
            เลิกทำ (Undo)
          </button>
        </div>
      )}

    </div>
  );
}
