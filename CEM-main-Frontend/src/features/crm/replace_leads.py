import re

with open("d:\\Sale_CRM\\CEM-main-Frontend\\src\\features\\crm\\App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add LeadsPage import
if 'import LeadsPage from "./pages/LeadsPage";' not in content:
    content = content.replace(
        'import RoleManagementPage from "./pages/RoleManagementPage";',
        'import RoleManagementPage from "./pages/RoleManagementPage";\nimport LeadsPage from "./pages/LeadsPage";'
    )

# Use regex to find the Leads block
# We know it starts with `{page === "leads" && (`
# and ends right before `{page === "dashboard" && (`
leads_start = content.find('{page === "leads" && (')
dashboard_start = content.find('{page === "dashboard" && (')

if leads_start != -1 and dashboard_start != -1:
    leads_block = content[leads_start:dashboard_start]
    
    replacement = """{page === "leads" && (
          <LeadsPage 
            leads={leads} currentUser={currentUser} allSellers={allSellers} checked={checked} setChecked={setChecked}
            search={search} setSearch={setSearch} filterStatus={filterStatus} finFilters={finFilters}
            showFavorites={showFavorites} setShowFavorites={setShowFavorites} setShowFilterModal={setShowFilterModal}
            isSellerDropdownOpen={isSellerDropdownOpen} setIsSellerDropdownOpen={setIsSellerDropdownOpen}
            filterSellers={filterSellers} setFilterSellers={setFilterSellers}
            paginatedLeads={paginatedLeads} sortConfig={sortConfig} handleSort={handleSort}
            toggleStar={toggleStar} setSelectedLead={setSelectedLead} actualPage={actualPage} itemsPerPage={itemsPerPage} inlineEdit={inlineEdit}
            dupNumbers={dupNumbers} followups={followups} setReassignConfirm={setReassignConfirm} fetchAllSellers={fetchAllSellers}
            filteredLength={filtered.length} totalPages={totalPages} setCurrentPage={setCurrentPage}
            canViewAll={canViewAll} canViewSelect={canViewSelect} canExport={canExport} canExportAll={canExportAll}
            handleExport={handleExport} setShowAddLead={setShowAddLead} setShowDeleteConfirm={setShowDeleteConfirm}
            topScrollRef={topScrollRef} handleTopScroll={handleTopScroll} handleBottomScroll={handleBottomScroll} bottomScrollRef={bottomScrollRef} syncTableWidth={syncTableWidth}
            filtered={filtered}
          />
        )}
        
        """
    
    new_content = content[:leads_start] + replacement + content[dashboard_start:]
    
    with open("d:\\Sale_CRM\\CEM-main-Frontend\\src\\features\\crm\\App.jsx", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully replaced Leads block.")
else:
    print("Could not find blocks.")
