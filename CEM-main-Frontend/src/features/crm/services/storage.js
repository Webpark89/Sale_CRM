import { SAMPLE_FOLLOWUPS, SAMPLE_LEADS } from "../data/sampleData";

export function loadData() {
  try {
    const leads = JSON.parse(localStorage.getItem("crm_leads") || "null");
    const followups = JSON.parse(localStorage.getItem("crm_followups") || "null");
    return { leads: leads || SAMPLE_LEADS, followups: followups || SAMPLE_FOLLOWUPS };
  } catch {
    return { leads: SAMPLE_LEADS, followups: SAMPLE_FOLLOWUPS };
  }
}

export function saveData(leads, followups) {
  localStorage.setItem("crm_leads", JSON.stringify(leads));
  localStorage.setItem("crm_followups", JSON.stringify(followups));
}