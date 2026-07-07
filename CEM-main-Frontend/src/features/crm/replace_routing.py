import re

with open("d:\\Sale_CRM\\CEM-main-Frontend\\src\\features\\crm\\App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace Leads
content = content.replace('{page === "leads" && (', '<Routes>\n        <Route path="/" element={<Navigate to={`/${getDefaultPage(currentUser)}`} replace />} />\n        <Route path="/leads" element={')
content = content.replace('        )}', '        } />', 1) # Only replace the first occurrence (which is leads)

# Replace Dashboard
content = content.replace('{page === "dashboard" && (', '<Route path="/dashboard" element={')
content = content.replace('          </div>\n        )}', '          </div>\n        } />', 1)

# Replace Reports
content = content.replace('{page === "reports" && (', '<Route path="/reports" element={')
content = content.replace('          </div>\n        )}', '          </div>\n        } />', 1)

# Replace Role Management
content = content.replace('{page === "role_management" && (currentUser?.role_is_system || currentUser?.permissions?.roles?.menu) && (', '<Route path="/role_management" element={(currentUser?.role_is_system || currentUser?.permissions?.roles?.menu) ? (')
content = content.replace('          </div>\n        )}', '          </div>\n        ) : <Navigate to="/" replace />} />', 1)

# Replace User Management
content = content.replace('{page === "user_management" && (currentUser?.role_is_system || currentUser?.permissions?.users?.menu) && (', '<Route path="/user_management" element={(currentUser?.role_is_system || currentUser?.permissions?.users?.menu) ? (')
content = content.replace('          </div>\n        )}', '          </div>\n        ) : <Navigate to="/" replace />} />\n        </Routes>', 1)

with open("d:\\Sale_CRM\\CEM-main-Frontend\\src\\features\\crm\\App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Routing replaced.")
