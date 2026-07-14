import React from "react";
import Modal from "../common/Modal";
import Btn from "../common/Btn";
import NotificationsPanel from "../modals/NotificationsPanel";
import FilterModal from "../modals/FilterModal";
import FollowupQuickForm from "../modals/FollowupQuickForm";
import AddLeadModal from "../modals/AddLeadModal";
import CompanyModal from "../modals/CompanyModal";
import { RG } from "../../constants/theme";
import { inputStyle } from "../common/styles";

export default function AppModals({
  showNotif, setShowNotif, notifTab, currentUser, myLeads, markDone, setSelectedLead, setIsModalReadOnly,
  showFilterModal, setShowFilterModal, filterStatus, setFilterStatus, finFilters, setFinFilters,
  dateFilters, setDateFilters, filterProvince, setFilterProvince,
  markDoneLead, setMarkDoneLead, followups, saveFollowup,
  showAddLead, setShowAddLead, leads, addLead, allSellers, fetchAllSellers,
  selectedLead, isModalReadOnly, saveLead, handleReassign, setReassignConfirm,
  reassignConfirm, selectedNewOwner, setSelectedNewOwner, isReassigning, handleReassignClick,
  confirmFinalReassign, setConfirmFinalReassign, handleFinalReassign,
  alertModal, setAlertModal,
  showDeleteConfirm, setShowDeleteConfirm, checked, deleteSelected
}) {
  React.useEffect(() => {
    if (reassignConfirm || showAddLead || selectedLead) {
      fetchAllSellers();
    }
  }, [reassignConfirm, showAddLead, selectedLead]);

  return (
    <>
      {showNotif && <NotificationsPanel notifTab={notifTab} currentUser={currentUser} leads={myLeads} onMarkDone={markDone} onViewLead={(lead) => { setSelectedLead(lead); setIsModalReadOnly(true); }} onClose={() => setShowNotif(false)} />}
      
      {showFilterModal && <FilterModal filterStatus={filterStatus} setFilterStatus={setFilterStatus} finFilters={finFilters} setFinFilters={setFinFilters} dateFilters={dateFilters} setDateFilters={setDateFilters} filterProvince={filterProvince} setFilterProvince={setFilterProvince} onClose={() => setShowFilterModal(false)} />}

      {markDoneLead && (
        <Modal title={`บันทึกการติดตาม — ${markDoneLead.companyName}`} onClose={() => setMarkDoneLead(null)}>
          <p style={{ color: RG.textMuted, fontSize: 14, marginBottom: 16 }}>กรุณาบันทึกการติดตามครั้งใหม่</p>
          {(() => {
            const fups = followups[markDoneLead.id] || [];
            const nextSeq = fups.length > 0 ? Math.max(...fups.map(f => f.sequence)) + 1 : 1;
            return <FollowupQuickForm leadId={markDoneLead.id} nextSeq={nextSeq} onSave={(lid, f) => { saveFollowup(lid, f); setMarkDoneLead(null); }} />;
          })()}
        </Modal>
      )}

      {showAddLead && <AddLeadModal leads={leads} onClose={() => setShowAddLead(false)} onSave={addLead} currentUser={currentUser} allSellers={allSellers} fetchAllSellers={fetchAllSellers} />}

      {selectedLead && <CompanyModal readOnly={isModalReadOnly} lead={selectedLead} leads={leads} followups={followups} onClose={() => { setSelectedLead(null); setIsModalReadOnly(false); }} onSave={saveLead} onSaveFollowup={saveFollowup} allSellers={allSellers} fetchAllSellers={fetchAllSellers} handleReassign={handleReassign} setReassignConfirm={setReassignConfirm} currentUser={currentUser} />}

      {reassignConfirm && (
        <Modal title={`โอนย้ายผู้ดูแล: ${reassignConfirm.companyName}`} onClose={() => { setReassignConfirm(null); setSelectedNewOwner(""); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <span style={{ color: RG.textMuted, fontSize: 14 }}>ผู้ดูแลปัจจุบัน:</span>
              <div style={{ fontWeight: 600, fontSize: 16, color: RG.text }}>{reassignConfirm.oldOwner || "-"}</div>
            </div>
            <div>
              <span style={{ color: RG.textMuted, fontSize: 14 }}>เลือกผู้ดูแลใหม่:</span>
              <select 
                value={selectedNewOwner} 
                onChange={e => setSelectedNewOwner(e.target.value)} 
                style={{ ...inputStyle, width: "100%", marginTop: 8 }}
              >
                <option value="" disabled>-- เลือกเซลส์ --</option>
                {allSellers.map(s => (
                  <option key={s.id} value={s.id}>{s.username} {s.display_name ? `(${s.display_name})` : ""}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button onClick={() => { setReassignConfirm(null); setSelectedNewOwner(""); }} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${RG.border}`, background: RG.surface, cursor: "pointer" }}>ยกเลิก</button>
              <button onClick={handleReassignClick} disabled={isReassigning} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: RG.primary, color: RG.surface, cursor: isReassigning ? "not-allowed" : "pointer" }}>
                ยืนยันการโอนย้าย
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmFinalReassign && (
        <Modal title="ยืนยันการโอนย้าย" onClose={() => setConfirmFinalReassign(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ margin: 0 }}>แน่ใจว่าจะเปลี่ยนใช่มั้ย?</p>
            <div style={{ display: "flex", gap: 10, marginTop: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmFinalReassign(false)} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${RG.border}`, background: RG.surface, cursor: "pointer" }}>ยกเลิก</button>
              <button onClick={handleFinalReassign} disabled={isReassigning} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: RG.danger, color: RG.surface, cursor: isReassigning ? "not-allowed" : "pointer" }}>
                {isReassigning ? "กำลังบันทึก..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {alertModal && (
        <Modal title={alertModal.type === 'success' ? "สำเร็จ" : "ข้อผิดพลาด"} onClose={() => setAlertModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "16px 0" }}>
            <div style={{ fontSize: 48 }}>
              {alertModal.type === 'success' ? '✅' : '❌'}
            </div>
            <p style={{ color: RG.text, fontSize: 16, textAlign: "center", margin: 0 }}>
              {alertModal.message}
            </p>
            <button onClick={() => setAlertModal(null)} style={{ padding: "8px 24px", borderRadius: 6, border: "none", background: RG.primary, color: RG.surface, cursor: "pointer", marginTop: 16, fontSize: 14, fontWeight: 600 }}>
              ตกลง
            </button>
          </div>
        </Modal>
      )}

      {showDeleteConfirm && (
        <Modal title="ยืนยันการลบ" onClose={() => setShowDeleteConfirm(false)}>
          <p style={{ color: RG.text, marginBottom: 20 }}>คุณต้องการลบ <strong>{checked.length}</strong> รายการหรือไม่? การกระทำนี้ไม่สามารถยกเลิกได้</p>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="danger" onClick={deleteSelected}>ลบ {checked.length} รายการ</Btn>
            <Btn variant="secondary" onClick={() => setShowDeleteConfirm(false)}>ยกเลิก</Btn>
          </div>
        </Modal>
      )}
    </>
  );
}
