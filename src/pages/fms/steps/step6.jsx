import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../../../api.js";

const STEP6_COLUMNS = [
  { key: "enqNo", label: "EnQ No" },
  { key: "clientName", label: "Client Name" },
  { key: "partnerType", label: "Partner Type" },
  { key: "purpose", label: "Purpose" },
  { key: "location", label: "Location" },
  { key: "contactInfo", label: "Contact Info" },
  { key: "concernPerson", label: "Concern Person" },
  { key: "step6Planned", label: "Planned Date" },
  { key: "step6FollowCounter", label: "Follow Up #" },
];

const STATUS_OPTIONS = [
  { value: "Done", label: "Done", icon: "bi-check-circle", color: "var(--accent-green)" },
  { value: "Reschedule", label: "Reschedule", icon: "bi-arrow-clockwise", color: "var(--accent-yellow)" },
];

// ============ MODAL ============
function Step6Modal({ show, lead, onClose, onSuccess }) {
  const [status, setStatus] = useState("");
  const [plannedOverride, setPlannedOverride] = useState("");
  const [nextStepPlanned, setNextStepPlanned] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!show || !lead) return null;

  const handleSubmit = async () => {
    if (!status && !plannedOverride.trim()) {
      toast.warn("Please select a status or update planned date");
      return;
    }

    if (status === "Reschedule" && !plannedOverride.trim()) {
      toast.warn("Please set the new planned date for reschedule");
      return;
    }

    if (status === "Done" && !nextStepPlanned.trim()) {
      toast.warn("Please set the Step 7 Planned Date");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/fms/step6/update", {
        rowIndex: lead.rowIndex,
        enqNo: lead.enqNo,
        status: status || null,
        plannedOverride: plannedOverride.trim() || null,
        nextStepPlanned: nextStepPlanned.trim() || null,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        onSuccess?.();
        onClose();
      } else {
        throw new Error(res.data.error || "Update failed");
      }
    } catch (err) {
      toast.error("Update failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStatus("");
    setPlannedOverride("");
    setNextStepPlanned("");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content step6-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="bi bi-arrow-repeat" style={{ marginRight: 8 }}></i>Step 6: Follow Up</h3>
          <button className="close-btn" onClick={handleClose} disabled={submitting}>&times;</button>
        </div>
        <div className="modal-body">
          {/* Lead Info */}
          <div className="lead-info-card">
            <div className="info-row"><span className="info-label">EnQ No:</span><span className="info-value">{lead.enqNo}</span></div>
            <div className="info-row"><span className="info-label">Client:</span><span className="info-value">{lead.clientName}</span></div>
            <div className="info-row"><span className="info-label">Location:</span><span className="info-value">{lead.location}</span></div>
            <div className="info-row"><span className="info-label">Planned Date:</span><span className="info-value">{lead.step6Planned}</span></div>
            <div className="info-row">
              <span className="info-label">Follow-up Count:</span>
              <span className="info-value">
                <span className="follow-counter-badge">{lead.step6FollowCounter || "0"}</span>
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="form-group">
            <label><i className="bi bi-flag" style={{ marginRight: 6 }}></i>Status <span className="required">*</span></label>
            <div className="status-options">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`status-option ${status === opt.value ? "selected" : ""}`}
                  onClick={() => setStatus(status === opt.value ? "" : opt.value)}
                  disabled={submitting}
                  style={{ "--option-color": opt.color }}
                >
                  <i className={`bi ${opt.icon}`}></i>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reschedule: New Planned Date (required) */}
          {status === "Reschedule" && (
            <div className="form-group" style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: 8, padding: "14px 16px" }}>
              <label style={{ color: "var(--accent-yellow)", fontWeight: 600 }}>
                <i className="bi bi-calendar-plus" style={{ marginRight: 6 }}></i>
                New Follow-up Date & Time <span className="required">*</span>
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={plannedOverride}
                onChange={(e) => setPlannedOverride(e.target.value)}
                disabled={submitting}
              />
              <small className="form-hint">Counter will increase by 1</small>
            </div>
          )}

          {/* Done: Step 7 Planned Date (required) */}
          {status === "Done" && (
            <div className="form-group next-step-planned-group">
              <label>
                <i className="bi bi-calendar-plus" style={{ marginRight: 6 }}></i>
                Step 7 (Agreement) Planned Date & Time <span className="required">*</span>
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={nextStepPlanned}
                onChange={(e) => setNextStepPlanned(e.target.value)}
                disabled={submitting}
              />
              <small className="form-hint">This will be the Planned date for Step 7: Agreement</small>
            </div>
          )}

          {/* Planned Override (when no status or Done) */}
          {status !== "Reschedule" && (
            <div className="form-group">
              <label><i className="bi bi-calendar-event" style={{ marginRight: 6 }}></i>Planned Date Override (Optional)</label>
              <input type="datetime-local" className="form-input" value={plannedOverride} onChange={(e) => setPlannedOverride(e.target.value)} />
              <small className="form-hint">Leave empty to keep current planned date</small>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-cancel" onClick={handleClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || (!status && !plannedOverride)}>
            {submitting ? <><span className="spinner-small"></span> Updating...</> : <><i className="bi bi-check-lg" style={{ marginRight: 4 }}></i>Submit</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ TAB ============
export default function Step6({ currentUser, onNextAction }) {
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({ queryKey: ["fms-step6"], queryFn: () => api.get("/fms/step6").then((r) => r.data), staleTime: 30000 });
  const leads = data?.leads || [];
  const filteredLeads = leads.filter((lead) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (lead.enqNo||"").toLowerCase().includes(q)||(lead.clientName||"").toLowerCase().includes(q)||(lead.location||"").toLowerCase().includes(q)||(lead.concernPerson||"").toLowerCase().includes(q);
  });

  const handleAction = (lead) => { setSelectedLead(lead); setShowModal(true); };
  const handleSuccess = () => { queryClient.invalidateQueries(["fms-step6"]); queryClient.invalidateQueries(["fms-step7"]); };

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
        <div className="loading"><div className="spinner"></div><span>Loading Step 6 leads...</span></div>
      ) : filteredLeads.length === 0 ? (
        <div className="empty-state"><i className="bi bi-inbox"></i><p>No leads pending in Step 6</p><small>Leads will appear here when Step 5 is Done and moved to Proposal Done Leads</small></div>
      ) : (
        <div className="table-wrapper">
          <table className="lead-table">
            <thead><tr>{STEP6_COLUMNS.map((col) => <th key={col.key}>{col.label}</th>)}<th>Actions</th></tr></thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.enqNo}>
                  {STEP6_COLUMNS.map((col) => (
                    <td key={col.key}>
                      {col.key === "step6FollowCounter"
                        ? <span className="follow-counter-badge">{lead[col.key] || "0"}</span>
                        : (lead[col.key] || "—")
                      }
                    </td>
                  ))}
                  <td className="actions-cell">
                    {onNextAction && <button className="btn btn-nap" onClick={() => onNextAction(lead, "FMS", "Step 6: Follow Up")} title="Next Action Plan"><i className="bi bi-ticket-perforated"></i>NAP</button>}
                    <button className="btn btn-action" onClick={() => handleAction(lead)} title="Update Step 6"><i className="bi bi-pencil-square"></i>Action</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Step6Modal show={showModal} lead={selectedLead} onClose={() => { setShowModal(false); setSelectedLead(null); }} onSuccess={handleSuccess} />
    </div>
  );
}