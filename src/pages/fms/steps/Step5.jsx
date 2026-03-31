import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../../../api.js";

// Columns to display in table
const STEP5_COLUMNS = [
  { key: "enqNo", label: "EnQ No" },
  { key: "clientName", label: "Client Name" },
  { key: "partnerType", label: "Partner Type" },
  { key: "purpose", label: "Purpose" },
  { key: "location", label: "Location" },
  { key: "contactInfo", label: "Contact Info" },
  { key: "concernPerson", label: "Concern Person" },
  { key: "step5Planned", label: "Planned Date" },
];

// ============ MODAL COMPONENT ============
function Step5Modal({ show, lead, onClose, onSuccess }) {
  const [plannedOverride, setPlannedOverride] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!show || !lead) return null;

  const handleSubmitDone = async () => {
    setSubmitting(true);

    try {
      const res = await api.post("/fms/step5/update", {
        rowIndex: lead.rowIndex,
        enqNo: lead.enqNo,
        status: "Done",
        plannedOverride: plannedOverride.trim() || null,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        onSuccess?.();
        onClose();
      } else {
        throw new Error(res.data.error || "Update failed");
      }
    } catch (err) {
      console.error("Step 5 update error:", err);
      toast.error("Update failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setPlannedOverride("");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content step5-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="bi bi-file-earmark-check" style={{ marginRight: 8 }}></i>
            Step 5: Proposal
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
              <span className="info-value">{lead.step5Planned}</span>
            </div>
            {lead.pdfFolder && (
              <div className="info-row">
                <span className="info-label">Folder:</span>
                <span className="info-value">
                  <a href={lead.pdfFolder} target="_blank" rel="noopener noreferrer" className="folder-link">
                    <i className="bi bi-folder2-open"></i> Open Drive Folder
                  </a>
                </span>
              </div>
            )}
          </div>

          {/* Status — only Done */}
          <div className="form-group">
            <label>
              <i className="bi bi-flag" style={{ marginRight: 6 }}></i>
              Status
            </label>
            <div className="status-options" style={{ gridTemplateColumns: "1fr" }}>
              <button
                type="button"
                className="status-option selected"
                disabled={submitting}
                style={{ "--option-color": "var(--accent-green)", cursor: "default" }}
              >
                <i className="bi bi-check-circle"></i>
                Done
              </button>
            </div>
          </div>

          {/* Planned Override (optional) */}
          <div className="form-group">
            <label>
              <i className="bi bi-calendar-event" style={{ marginRight: 6 }}></i>
              Planned Date Override (Optional)
            </label>
            <input
              type="datetime-local"
              className="form-input"
              value={plannedOverride}
              onChange={(e) => setPlannedOverride(e.target.value)}
              disabled={submitting}
            />
            <small className="form-hint">Leave empty to keep current planned date</small>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-cancel" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmitDone}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-small"></span> Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg" style={{ marginRight: 4 }}></i>
                Mark as Done
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ TAB CONTENT COMPONENT ============
export default function Step5({ currentUser, onNextAction }) {
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch Step 5 leads
  const { data, isLoading, error } = useQuery({
    queryKey: ["fms-step5"],
    queryFn: () => api.get("/fms/step5").then((r) => r.data),
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
    queryClient.invalidateQueries(["fms-step5"]);
    queryClient.invalidateQueries(["done"]);
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
          <span>Loading Step 5 leads...</span>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-inbox"></i>
          <p>No leads pending in Step 5</p>
          <small>Leads will appear here when Step 4 is marked Done with Step 5 Planned date</small>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="lead-table">
            <thead>
              <tr>
                {STEP5_COLUMNS.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.enqNo}>
                  {STEP5_COLUMNS.map((col) => (
                    <td key={col.key}>{lead[col.key] || "—"}</td>
                  ))}
                  <td className="actions-cell">
                    {lead.pdfFolder && (
                      <a
                        href={lead.pdfFolder}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-folder"
                        title="Open Drive Folder"
                      >
                        <i className="bi bi-folder2-open"></i>
                      </a>
                    )}
                    {onNextAction && (
                      <button
                        className="btn btn-nap"
                        onClick={() => onNextAction(lead, "FMS", "Step 5: Proposal")}
                        title="Next Action Plan"
                      >
                        <i className="bi bi-ticket-perforated"></i>
                        NAP
                      </button>
                    )}
                    <button
                      className="btn btn-action"
                      onClick={() => handleAction(lead)}
                      title="Update Step 5"
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

      {/* Step 5 Modal */}
      <Step5Modal
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