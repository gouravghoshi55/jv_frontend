import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../../../api.js";

// Columns to display in table
const STEP3_COLUMNS = [
  { key: "enqNo", label: "EnQ No" },
  { key: "clientName", label: "Client Name" },
  { key: "partnerType", label: "Partner Type" },
  { key: "purpose", label: "Purpose" },
  { key: "location", label: "Location" },
  { key: "contactInfo", label: "Contact Info" },
  { key: "concernPerson", label: "Concern Person" },
  { key: "step3Planned", label: "Planned Date" },
];

// Status options
const STATUS_OPTIONS = [
  { value: "Done", label: "Done", icon: "bi-check-circle", color: "var(--accent-green)" },
  { value: "Cold Lead", label: "Cold Lead", icon: "bi-snow2", color: "var(--accent-blue)" },
  { value: "Back to Pipeline", label: "Back to Pipeline", icon: "bi-arrow-return-left", color: "var(--accent-yellow)" },
  { value: "Not Qualified Lead", label: "Not Qualified Lead", icon: "bi-x-circle", color: "var(--accent-red)" },
];

// ============ MODAL COMPONENT ============
function Step3Modal({ show, lead, onClose, onSuccess }) {
  const [status, setStatus] = useState("");
  const [plannedOverride, setPlannedOverride] = useState("");
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!show || !lead) return null;

  const handleSubmit = async () => {
    // Allow submit if either status or planned date is provided
    if (!status && !plannedOverride.trim()) {
      toast.warn("Please select a status or update planned date");
      return;
    }

    // Confirm if moving to another sheet
    if (status && status !== "Done") {
      const confirmMsg = `Are you sure you want to move this lead to ${status === "Back to Pipeline" ? "Pipeline" : status}?`;
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await api.post("/fms/step3/update", {
        rowIndex: lead.rowIndex,
        enqNo: lead.enqNo,
        status: status || null,
        plannedOverride: plannedOverride.trim() || null,
        remark: remark.trim(),
      });

      if (res.data.success) {
        toast.success(res.data.message);
        onSuccess?.();
        onClose();
      } else {
        throw new Error(res.data.error || "Update failed");
      }
    } catch (err) {
      console.error("Step 3 update error:", err);
      toast.error("Update failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStatus("");
    setPlannedOverride("");
    setRemark("");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content step3-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="bi bi-people" style={{ marginRight: 8 }}></i>
            Step 3: Need Analysis Meeting
          </h3>
          <button className="close-btn" onClick={handleClose} disabled={submitting}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* Lead Info Card */}
          <div className="lead-info-card">
            <div className="info-row">
              <span className="info-label">EnQ No:</span>
              <span className="info-value">{lead.enqNo}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Client:</span>
              <span className="info-value">{lead.clientName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Location:</span>
              <span className="info-value">{lead.location}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Planned Date:</span>
              <span className="info-value">{lead.step3Planned}</span>
            </div>
          </div>

          {/* Status Selection */}
          <div className="form-group">
            <label>
              <i className="bi bi-flag" style={{ marginRight: 6 }}></i>
              Status
            </label>
            <div className="status-options">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`status-option ${status === opt.value ? "selected" : ""}`}
                  onClick={() => setStatus(status === opt.value ? "" : opt.value)}
                  disabled={submitting}
                  style={{
                    "--option-color": opt.color,
                  }}
                >
                  <i className={`bi ${opt.icon}`}></i>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Planned Override */}
          <div className="form-group">
            <label>
              <i className="bi bi-calendar-event" style={{ marginRight: 6 }}></i>
              Planned Date & Time (Optional)
            </label>
            <input
              type="datetime-local"
              className="form-input"
              value={plannedOverride}
              onChange={(e) => setPlannedOverride(e.target.value)}
            />
            <small className="form-hint">Leave empty to keep current planned date, or set to update</small>
          </div>

          {/* Remark */}
          <div className="form-group">
            <label>
              <i className="bi bi-chat-left-text" style={{ marginRight: 6 }}></i>
              Remark
            </label>
            <textarea
              className="form-textarea"
              placeholder="Enter meeting notes, observations, or any remarks..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              disabled={submitting}
              rows={4}
            />
          </div>

          {/* Warning for move actions */}
          {status && status !== "Done" && (
            <div className="warning-box">
              <i className="bi bi-exclamation-triangle"></i>
              <span>
                This will move the lead to <strong>{status === "Back to Pipeline" ? "Pipeline" : status}</strong> and remove it from FMS.
              </span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-cancel" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting || (!status && !plannedOverride)}
          >
            {submitting ? (
              <>
                <span className="spinner-small"></span> Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg" style={{ marginRight: 4 }}></i>
                Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ TAB CONTENT COMPONENT ============
export default function Step3({ currentUser, onNextAction }) {
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch Step 3 leads
  const { data, isLoading, error } = useQuery({
    queryKey: ["fms-step3"],
    queryFn: () => api.get("/fms/step3").then((r) => r.data),
    staleTime: 30000,
  });

  const leads = data?.leads || [];

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (lead.enqNo || "").toLowerCase().includes(q) ||
      (lead.clientName || "").toLowerCase().includes(q) ||
      (lead.location || "").toLowerCase().includes(q) ||
      (lead.concernPerson || "").toLowerCase().includes(q)
    );
  });

  const handleAction = (lead) => {
    setSelectedLead(lead);
    setShowModal(true);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries(["fms-step3"]);
    queryClient.invalidateQueries(["fms-step4"]);
    queryClient.invalidateQueries(["pipeline"]);
    queryClient.invalidateQueries(["cold-leads"]);
    queryClient.invalidateQueries(["not-qualified"]);
  };

  return (
    <div className="step-content">
      {/* Search */}
      <div className="filter-bar">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            className="filter-input"
            placeholder="Search by EnQ No, client, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>
        <span className="result-count">{filteredLeads.length} leads</span>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-msg">
          <i className="bi bi-exclamation-triangle"></i>
          Failed to load: {error.message}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <span>Loading Step 3 leads...</span>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-inbox"></i>
          <p>No leads pending in Step 3</p>
          <small>Leads will appear here when Step 2 is complete and Step 3 Planned date is set</small>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="lead-table">
            <thead>
              <tr>
                {STEP3_COLUMNS.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.enqNo}>
                  {STEP3_COLUMNS.map((col) => (
                    <td key={col.key}>{lead[col.key] || "—"}</td>
                  ))}
                  <td className="actions-cell">
                    {onNextAction && (
                      <button
                        className="btn btn-nap"
                        onClick={() => onNextAction(lead, "FMS", "Step 3: Need Analysis Meeting")}
                        title="Next Action Plan"
                      >
                        <i className="bi bi-ticket-perforated"></i>
                        NAP
                      </button>
                    )}
                    <button
                      className="btn btn-action"
                      onClick={() => handleAction(lead)}
                      title="Update Step 3"
                    >
                      <i className="bi bi-pencil-square"></i>
                      Action
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Step 3 Modal */}
      <Step3Modal
        show={showModal}
        lead={selectedLead}
        onClose={() => {
          setShowModal(false);
          setSelectedLead(null);
        }}
        onSuccess={handleSuccess}
      />
    </div>
  );
}