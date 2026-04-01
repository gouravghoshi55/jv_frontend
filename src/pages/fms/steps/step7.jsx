import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../../../api.js";

const STEP7_COLUMNS = [
  { key: "enqNo", label: "EnQ No" },
  { key: "clientName", label: "Client Name" },
  { key: "partnerType", label: "Partner Type" },
  { key: "purpose", label: "Purpose" },
  { key: "location", label: "Location" },
  { key: "contactInfo", label: "Contact Info" },
  { key: "concernPerson", label: "Concern Person" },
  { key: "step7Planned", label: "Planned Date" },
];

// ============ MODAL ============
function Step7Modal({ show, lead, onClose, onSuccess }) {
  const [plannedOverride, setPlannedOverride] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!show || !lead) return null;

  const handleSubmitDone = async () => {
    const confirmMsg = "This will mark the lead as Done and move it to the DONE sheet. Continue?";
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      const res = await api.post("/fms/step7/update", {
        rowIndex: lead.rowIndex,
        enqNo: lead.enqNo,
        status: "Done",
        plannedOverride: plannedOverride.trim() || null,
      });
      if (res.data.success) { toast.success(res.data.message); onSuccess?.(); onClose(); }
      else throw new Error(res.data.error || "Update failed");
    } catch (err) {
      toast.error("Update failed: " + (err.response?.data?.error || err.message));
    } finally { setSubmitting(false); }
  };

  const handleClose = () => { setPlannedOverride(""); onClose(); };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content step7-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="bi bi-handshake" style={{ marginRight: 8 }}></i>Step 7: Agreement</h3>
          <button className="close-btn" onClick={handleClose} disabled={submitting}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="lead-info-card">
            <div className="info-row"><span className="info-label">EnQ No:</span><span className="info-value">{lead.enqNo}</span></div>
            <div className="info-row"><span className="info-label">Client:</span><span className="info-value">{lead.clientName}</span></div>
            <div className="info-row"><span className="info-label">Location:</span><span className="info-value">{lead.location}</span></div>
            <div className="info-row"><span className="info-label">Planned Date:</span><span className="info-value">{lead.step7Planned}</span></div>
            {lead.pdfFolder && (
              <div className="info-row"><span className="info-label">Folder:</span><span className="info-value">
                <a href={lead.pdfFolder} target="_blank" rel="noopener noreferrer" className="folder-link"><i className="bi bi-folder2-open"></i> Open Drive Folder</a>
              </span></div>
            )}
          </div>

          <div className="form-group">
            <label><i className="bi bi-flag" style={{ marginRight: 6 }}></i>Status</label>
            <div className="status-options" style={{ gridTemplateColumns: "1fr" }}>
              <button type="button" className="status-option selected" disabled={submitting} style={{ "--option-color": "var(--accent-green)", cursor: "default" }}>
                <i className="bi bi-check-circle"></i>Done — Move to DONE
              </button>
            </div>
          </div>

          <div className="form-group">
            <label><i className="bi bi-calendar-event" style={{ marginRight: 6 }}></i>Planned Date Override (Optional)</label>
            <input type="datetime-local" className="form-input" value={plannedOverride} onChange={(e) => setPlannedOverride(e.target.value)} disabled={submitting} />
            <small className="form-hint">Leave empty to keep current planned date</small>
          </div>

          <div className="warning-box" style={{ background: "rgba(16, 185, 129, 0.1)", borderColor: "rgba(16, 185, 129, 0.3)", color: "var(--accent-green)" }}>
            <i className="bi bi-info-circle"></i>
            <span>Marking as Done will move this lead to the <strong>DONE</strong> sheet permanently.</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-cancel" onClick={handleClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmitDone} disabled={submitting}>
            {submitting ? <><span className="spinner-small"></span> Moving...</> : <><i className="bi bi-check-lg" style={{ marginRight: 4 }}></i>Mark as Done</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ TAB ============
export default function Step7({ currentUser, onNextAction }) {
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({ queryKey: ["fms-step7"], queryFn: () => api.get("/fms/step7").then((r) => r.data), staleTime: 30000 });
  const leads = data?.leads || [];
  const filteredLeads = leads.filter((lead) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (lead.enqNo||"").toLowerCase().includes(q)||(lead.clientName||"").toLowerCase().includes(q)||(lead.location||"").toLowerCase().includes(q)||(lead.concernPerson||"").toLowerCase().includes(q);
  });

  const handleAction = (lead) => { setSelectedLead(lead); setShowModal(true); };
  const handleSuccess = () => { queryClient.invalidateQueries(["fms-step7"]); queryClient.invalidateQueries(["done"]); };

  return (
    <div className="step-content">
      <div className="filter-bar">
        <div className="search-box"><i className="bi bi-search"></i>
          <input type="text" className="filter-input" placeholder="Search by EnQ No, client, location..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && <button className="search-clear" onClick={() => setSearch("")}><i className="bi bi-x"></i></button>}
        </div>
        <span className="result-count">{filteredLeads.length} leads</span>
      </div>

      {error && <div className="error-msg"><i className="bi bi-exclamation-triangle"></i>Failed to load: {error.message}</div>}

      {isLoading ? (
        <div className="loading"><div className="spinner"></div><span>Loading Step 7 leads...</span></div>
      ) : filteredLeads.length === 0 ? (
        <div className="empty-state"><i className="bi bi-inbox"></i><p>No leads pending in Step 7</p><small>Leads will appear here when Step 6 is Done</small></div>
      ) : (
        <div className="table-wrapper">
          <table className="lead-table">
            <thead><tr>{STEP7_COLUMNS.map((col) => <th key={col.key}>{col.label}</th>)}<th>Actions</th></tr></thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.enqNo}>
                  {STEP7_COLUMNS.map((col) => <td key={col.key}>{lead[col.key] || "—"}</td>)}
                  <td className="actions-cell">
                    {onNextAction && <button className="btn btn-nap" onClick={() => onNextAction(lead, "FMS", "Step 7: Agreement")} title="Next Action Plan"><i className="bi bi-ticket-perforated"></i>NAP</button>}
                    <button className="btn btn-action" onClick={() => handleAction(lead)} title="Update Step 7"><i className="bi bi-pencil-square"></i>Action</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Step7Modal show={showModal} lead={selectedLead} onClose={() => { setShowModal(false); setSelectedLead(null); }} onSuccess={handleSuccess} />
    </div>
  );
}