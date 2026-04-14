import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../../../api.js";
import FilePreviewModal from "../../../components/Filepreviewmodal.jsx";
import RemarksSection from "../../../components/Remarkssection.jsx";

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

function getAllPreviewFiles(lead) {
  const files = [];
  if (lead.aks) files.push({ label: "AKS", link: lead.aks });
  if (lead.khasra) files.push({ label: "Khasra", link: lead.khasra });
  if (lead.oldDocument)
    files.push({ label: "Old Document", link: lead.oldDocument });
  if (lead.landSurvey)
    files.push({ label: "Land Survey", link: lead.landSurvey });
  if (lead.step4TypeOfProject)
    files.push({ label: "Type Of Project", link: lead.step4TypeOfProject });
  if (lead.step4CadFile)
    files.push({ label: "CAD File", link: lead.step4CadFile });
  if (lead.step4CalcLink)
    files.push({ label: "Calculation Link", link: lead.step4CalcLink });
  return files;
}

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalContent: {
    backgroundColor: "var(--bg-primary, #ffffff)",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid var(--border-primary, #e5e7eb)",
    backgroundColor: "var(--bg-secondary, #f9fafb)",
  },
  modalTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 600,
    color: "var(--text-primary, #111827)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "var(--text-secondary, #6b7280)",
    padding: "4px 8px",
    borderRadius: "6px",
    lineHeight: 1,
  },
  modalBody: { padding: "20px", overflowY: "auto", flex: 1 },
  leadInfoCard: {
    backgroundColor: "var(--bg-tertiary, #f3f4f6)",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "20px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid var(--border-secondary, #e5e7eb)",
  },
  infoRowLast: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
  },
  infoLabel: {
    fontSize: "13px",
    color: "var(--text-secondary, #6b7280)",
    fontWeight: 500,
  },
  infoValue: {
    fontSize: "14px",
    color: "var(--text-primary, #111827)",
    fontWeight: 500,
  },
  folderLink: {
    color: "#22c55e",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    fontWeight: 500,
  },
  formGroup: { marginBottom: "20px" },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--text-primary, #111827)",
    marginBottom: "8px",
  },
  statusOptions: { display: "grid", gridTemplateColumns: "1fr", gap: "10px" },
  statusOptionDone: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "2px solid #22c55e",
    backgroundColor: "#22c55e",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "default",
  },
  formInput: {
    width: "100%",
    padding: "12px 14px",
    fontSize: "14px",
    border: "1px solid var(--border-primary, #d1d5db)",
    borderRadius: "8px",
    backgroundColor: "var(--bg-primary, #ffffff)",
    color: "var(--text-primary, #111827)",
    outline: "none",
    boxSizing: "border-box",
  },
  formHint: {
    display: "block",
    fontSize: "12px",
    color: "var(--text-secondary, #6b7280)",
    marginTop: "6px",
  },
  modalFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "16px 20px",
    borderTop: "1px solid var(--border-primary, #e5e7eb)",
    backgroundColor: "var(--bg-secondary, #f9fafb)",
  },
  btnCancel: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 500,
    borderRadius: "8px",
    border: "1px solid var(--border-primary, #d1d5db)",
    backgroundColor: "var(--bg-primary, #ffffff)",
    color: "var(--text-primary, #374151)",
    cursor: "pointer",
  },
  btnPrimary: {
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 500,
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#22c55e",
    color: "#ffffff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
  spinnerSmall: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

const spinnerKeyframes = `@keyframes spin { to { transform: rotate(360deg); } }`;

function Step5Modal({ show, lead, onClose, onSuccess }) {
  const [plannedOverride, setPlannedOverride] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const remarksRef = React.useRef(null);

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
        const remarkText = remarksRef.current?.getRemarkText() || "";
        if (remarkText.trim()) {
          await remarksRef.current.saveRemark(remarkText);
        }
        toast.success(res.data.message);
        onSuccess?.();
        onClose();
      } else {
        throw new Error(res.data.error || "Update failed");
      }
    } catch (err) {
      toast.error(
        "Update failed: " + (err.response?.data?.error || err.message),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setPlannedOverride("");
    onClose();
  };

  return (
    <>
      <style>{spinnerKeyframes}</style>
      <div style={styles.modalOverlay} onClick={handleClose}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>
              <i className="bi bi-file-earmark-check"></i>Step 5: Proposal
            </h3>
            <button
              style={{
                ...styles.closeBtn,
                ...(submitting && styles.btnDisabled),
              }}
              onClick={handleClose}
              disabled={submitting}
            >
              &times;
            </button>
          </div>
          <div style={styles.modalBody}>
            <div style={styles.leadInfoCard}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>EnQ No:</span>
                <span style={styles.infoValue}>{lead.enqNo}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Client:</span>
                <span style={styles.infoValue}>{lead.clientName}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Location:</span>
                <span style={styles.infoValue}>{lead.location}</span>
              </div>
              <div style={lead.pdfFolder ? styles.infoRow : styles.infoRowLast}>
                <span style={styles.infoLabel}>Planned Date:</span>
                <span style={styles.infoValue}>{lead.step5Planned}</span>
              </div>
              {lead.pdfFolder && (
                <div style={styles.infoRowLast}>
                  <span style={styles.infoLabel}>Folder:</span>
                  <span style={styles.infoValue}>
                    <a
                      href={lead.pdfFolder}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.folderLink}
                    >
                      <i className="bi bi-folder2-open"></i> Open Drive Folder
                    </a>
                  </span>
                </div>
              )}
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <i className="bi bi-flag"></i>Status
              </label>
              <div style={styles.statusOptions}>
                <button
                  type="button"
                  style={{
                    ...styles.statusOptionDone,
                    ...(submitting && styles.btnDisabled),
                  }}
                  disabled={submitting}
                >
                  <i className="bi bi-check-circle"></i>Done
                </button>
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <i className="bi bi-calendar-event"></i>Planned Date Override
                (Optional)
              </label>
              <input
                type="datetime-local"
                style={{
                  ...styles.formInput,
                  ...(submitting && styles.btnDisabled),
                }}
                value={plannedOverride}
                onChange={(e) => setPlannedOverride(e.target.value)}
                disabled={submitting}
              />
              <small style={styles.formHint}>
                Leave empty to keep current planned date
              </small>
            </div>
            {/* Remarks Section */}
            <RemarksSection
              ref={remarksRef}
              enqNo={lead.enqNo}
              stepName="Step 5: Proposal"
              disabled={submitting}
            />
          </div>
          <div style={styles.modalFooter}>
            <button
              style={{
                ...styles.btnCancel,
                ...(submitting && styles.btnDisabled),
              }}
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              style={{
                ...styles.btnPrimary,
                ...(submitting && styles.btnDisabled),
              }}
              onClick={handleSubmitDone}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span style={styles.spinnerSmall}></span>Updating...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg"></i>Mark as Done
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Step5({ currentUser, onNextAction }) {
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [previewLead, setPreviewLead] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["fms-step5"],
    queryFn: () => api.get("/fms/step5").then((r) => r.data),
    staleTime: 30000,
  });
  const leads = data?.leads || [];
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
  const handlePreview = (lead) => {
    setPreviewLead(lead);
    setShowPreview(true);
  };
  const handleSuccess = () => {
    queryClient.invalidateQueries(["fms-step5"]);
    queryClient.invalidateQueries(["done"]);
  };

  return (
    <div className="step-content">
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
      {error && (
        <div className="error-msg">
          <i className="bi bi-exclamation-triangle"></i>Failed to load:{" "}
          {error.message}
        </div>
      )}
      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <span>Loading Step 5 leads...</span>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-inbox"></i>
          <p>No leads pending in Step 5</p>
          <small>
            Leads will appear here when Step 4 is marked Done with Step 5
            Planned date
          </small>
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
                      <button
                        className="btn btn-folder"
                        onClick={() => handlePreview(lead)}
                        title="Preview Files"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    )}
                    {onNextAction && (
                      <button
                        className="btn btn-nap"
                        onClick={() =>
                          onNextAction(lead, "FMS", "Step 5: Proposal")
                        }
                        title="Next Action Plan"
                      >
                        <i className="bi bi-ticket-perforated"></i>NAP
                      </button>
                    )}
                    <button
                      className="btn btn-action"
                      onClick={() => handleAction(lead)}
                      title="Update Step 5"
                    >
                      <i className="bi bi-pencil-square"></i>Action
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Step5Modal
        show={showModal}
        lead={selectedLead}
        onClose={() => {
          setShowModal(false);
          setSelectedLead(null);
        }}
        onSuccess={handleSuccess}
      />
      <FilePreviewModal
        show={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewLead(null);
        }}
        files={previewLead ? getAllPreviewFiles(previewLead) : []}
        folderLink={previewLead?.pdfFolder}
        title={
          previewLead
            ? `Files — ${previewLead.clientName} (${previewLead.enqNo})`
            : "Files"
        }
      />
    </div>
  );
}
