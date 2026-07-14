// =====================================================================
// theme.js — ตัวแปรสีทั้งหมด (อ้างอิง CSS Variables จาก src/theme.css)
// =====================================================================
// ⚠️  ต้องการเปลี่ยนสี → แก้ที่ไฟล์  src/theme.css  ไฟล์เดียวพอครับ!
// =====================================================================
export const RG = {
  // === PRIMARY PALETTE ===
  primary:       "var(--color-primary)",
  primaryMid:    "var(--color-primary-mid)",
  primaryLight:  "var(--color-primary-light)",
  primaryPale:   "var(--color-primary-pale)",
  primaryGhost:  "var(--color-primary-ghost)",

  navbarBg:      "var(--color-navbar-bg)",

  // === FONTS ===
  fontHeading:   "var(--font-heading)",
  fontBody:      "var(--font-body)",

  // === GRADIENTS ===
  gradient:      "var(--gradient-primary)",
  gradientSoft:  "var(--gradient-soft)",
  gradientHero:  "var(--gradient-hero)",

  // === NEUTRALS & EFFECTS ===
  text:          "var(--color-text)",
  textMuted:     "var(--color-text-muted)",
  surface:       "var(--color-surface)",
  surfaceSolid:  "var(--color-surface)",
  background:    "var(--color-background)",
  border:        "var(--color-border)",
  shadowSoft:    "var(--shadow-soft)",
  shadowGlow:    "var(--shadow-glow)",
  glassFilter:   "none",

  // === TABLE ROW ALTERNATING ===
  rowOdd:        "var(--color-row-odd)",
  rowEven:       "var(--color-row-even)",

  // === SIDEBAR (PANEL MENU) ===
  sidebarBg:           "var(--color-sidebar-bg)",
  sidebarBorder:       "var(--color-sidebar-border)",
  sidebarLogoBg:       "var(--color-sidebar-logo-bg)",
  sidebarLogoText:     "var(--color-sidebar-logo-text)",
  sidebarActiveBg:     "var(--color-sidebar-active-bg)",
  sidebarActiveShadow: "var(--color-sidebar-active-shadow)",
  sidebarText:         "var(--color-sidebar-text)",
  sidebarTextActive:   "var(--color-sidebar-text-active)",
  sidebarToggleBg:     "var(--color-sidebar-toggle-bg)",
  sidebarToggleBorder: "var(--color-sidebar-toggle-border)",
  sidebarToggleText:   "var(--color-sidebar-toggle-text)",

  // === SEMANTIC ===
  success:       "var(--color-success)",
  successPale:   "var(--color-success-pale)",
  warn:          "var(--color-warn)",
  warnPale:      "var(--color-warn-pale)",
  danger:        "var(--color-danger)",
  dangerPale:    "var(--color-danger-pale)",
  info:          "var(--color-info)",
  infoPale:      "var(--color-info-pale)",
};