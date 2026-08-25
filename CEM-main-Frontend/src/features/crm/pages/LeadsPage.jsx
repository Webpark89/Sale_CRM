import React from "react";
import { RG } from "../constants/theme";
import LeadsHeader from "../components/leads/LeadsHeader";
import LeadsTable from "../components/leads/LeadsTable";
import LeadsPagination from "../components/leads/LeadsPagination";

export default function LeadsPage({
  leads, currentUser, allSellers, checked, setChecked, 
  search, setSearch, filterStatus, filterLatestStatus, finFilters, dateFilters, setDateFilters, 
  showFavorites, setShowFavorites, setShowFilterModal,
  isSellerDropdownOpen, setIsSellerDropdownOpen,
  filterSellers, setFilterSellers,
  filterProvince,
  paginatedLeads, sortConfig, handleSort,
  toggleStar, setSelectedLead, actualPage, itemsPerPage, inlineEdit,
  dupNumbers, followups, setReassignConfirm, fetchAllSellers,
  filteredLength, totalPages, setCurrentPage,
  canViewAll, canViewSelect, canExport, canExportAll,
  handleExport, setShowAddLead, setShowDeleteConfirm,
  topScrollRef, handleTopScroll, handleBottomScroll, bottomScrollRef, syncTableWidth,
  filtered
}) {
  return (
    <>
      <LeadsHeader 
        currentUser={currentUser}
        search={search} setSearch={setSearch}
        setShowAddLead={setShowAddLead}
        showFavorites={showFavorites} setShowFavorites={setShowFavorites}
        filterStatus={filterStatus} finFilters={finFilters} setShowFilterModal={setShowFilterModal} dateFilters={dateFilters} setDateFilters={setDateFilters}
        canViewAll={canViewAll} canViewSelect={canViewSelect}
        isSellerDropdownOpen={isSellerDropdownOpen} setIsSellerDropdownOpen={setIsSellerDropdownOpen}
        filterSellers={filterSellers} setFilterSellers={setFilterSellers}
        leads={leads}
        canExport={canExport} canExportAll={canExportAll}
        handleExport={handleExport}
      />

      <div style={{ background: RG.surface, borderRadius: 12, border: `1px solid ${RG.border}`, overflow: "hidden", boxShadow: RG.shadowSoft, backdropFilter: RG.glassFilter, padding: 24 }}>
        {checked.length > 0 && (
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center" }}>
            <button onClick={() => setShowDeleteConfirm(true)} className="btn-delete" title="ลบข้อมูลที่เลือก">
              🗑 <span style={{ fontSize: 14, fontWeight: 700 }}>ลบข้อมูลที่เลือก ({checked.length})</span>
            </button>
          </div>
        )}
        <div style={{ position: "relative" }}>
        
        <LeadsTable 
          paginatedLeads={paginatedLeads}
          sortConfig={sortConfig} handleSort={handleSort}
          checked={checked} setChecked={setChecked}
          toggleStar={toggleStar} setSelectedLead={setSelectedLead}
          actualPage={actualPage} itemsPerPage={itemsPerPage}
          inlineEdit={inlineEdit} dupNumbers={dupNumbers}
          followups={followups} currentUser={currentUser}
          setReassignConfirm={setReassignConfirm} fetchAllSellers={fetchAllSellers}
          topScrollRef={topScrollRef} handleTopScroll={handleTopScroll}
          handleBottomScroll={handleBottomScroll} bottomScrollRef={bottomScrollRef}
          syncTableWidth={syncTableWidth}
        />
      </div>

      <LeadsPagination 
        paginatedLeads={paginatedLeads}
        filteredLength={filteredLength}
        totalLength={leads.length}
        filterStatus={filterStatus}
        filterLatestStatus={filterLatestStatus}
        filterProvince={filterProvince}
        actualPage={actualPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />
    </div>
    </>
  );
}
