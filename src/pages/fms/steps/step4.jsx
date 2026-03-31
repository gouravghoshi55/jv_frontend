import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../../../api.js";

// Columns to display in table
const STEP4_COLUMNS = [
  { key: "enqNo", label: "EnQ No" },
  { key: "clientName", label: "Client Name" },
  { key: "partnerType", label: "Partner Type" },
  { key: "purpose", label: "Purpose" },
  { key: "location", label: "Location" },
  { key: "contactInfo", label: "Contact Info" },
  { key: "concernPerson", label: "Concern Person" },
  { key: "step4Planned", label: "Planned Date" },
];

// Status options
const STATUS_OPTIONS = [
  { value: "Done", label: "Done", icon: "bi-check-circle", color: "var(--accent-green)" },
  { value: "Cold Lead", label: "Cold Lead", icon: "bi-snow2", color: "var(--accent-blue)" },
  { value: "Back to Pipeline", label: "Back to Pipeline", icon: "bi-arrow-return-left", color: "var(--accent-yellow)" },
  { value: "Not Qualified Lead", label: "Not Qualified Lead", icon: "bi-x-circle", color: "var(--accent-red)" },
];

// File upload fields mapped to column indexes
const FILE_FIELDS = [
  { key: "typeOfProject", label: "Type Of Project", colIndex: 27 },
  { key: "cadFile", label: "CAD File of the Plan", colIndex: 28 },
  { key: "calcLink", label: "Calculation Link", colIndex: 29 },
];

// ============ MODAL COMPONENT ============
function Step4Modal({ show, lead, onClose, onSuccess }) {
  const [status, setStatus] = useState("");
  const [plannedOverride, setPlannedOverride] = useState("");
  const [nextStepPlanned, setNextStepPlanned] = useState("");
  const [files, setFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  if (!show || !lead) return null;

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (key, fileList) => {
    setFiles((prev) => ({ ...prev, [key]: fileList }));
  };

  const getFileNames = (fileList) => {
    if (!fileList || fileList.length === 0) return "Choose File";
    if (fileList.length === 1) return fileList[0].name;
    return `${fileList.length} files selected`;
  };

  // Upload files independently (without needing status)
  const handleUploadFiles = async () => {
    const selectedFiles = Object.entries(files).filter(
      ([_, fileList]) => fileList && fileList.length > 0
    );

    if (selectedFiles.length === 0) {
      toast.warn("Please select at least one file to upload");
      return;
    }

    if (!lead.pdfFolder) {
      toast.error("Parent folder not found. Please complete Step 2 first.");
      return;
    }

    setUploading(true);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const [key, fileList] = selectedFiles[i];
        const fieldInfo = FILE_FIELDS.find((f) => f.key === key);

        for (let j = 0; j < fileList.length; j++) {
          const file = fileList[j];
          setUploadProgress(`Uploading ${fieldInfo.label} (${j + 1}/${fileList.length})...`);

          const base64 = await fileToBase64(file);

          await api.post("/fms/step4/upload", {
            rowIndex: lead.rowIndex,
            enqNo: lead.enqNo,
            columnIndex: fieldInfo.colIndex,
            fileName: file.name,
            fileBase64: base64,
            mimeType: file.type || "application/octet-stream",
            folderLink: lead.pdfFolder,
          });
        }
      }

      toast.success("Files uploaded successfully!");
      setFiles({});
      onSuccess?.();
    } catch (err) {
      console.error("Step 4 upload error:", err);
      toast.error("Upload failed: " + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  };

  // Submit status update
  const handleSubmitStatus = async () => {
    if (!status && !plannedOverride.trim()) {
      toast.warn("Please select a status or update planned date");
      return;
    }

    // If Done, require next step planned date
    if (status === "Done" && !nextStepPlanned.trim()) {
      toast.warn("Please set the Next Step (Step 5) Planned Date");
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
      const res = await api.post("/fms/step4/update", {
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
      console.error("Step 4 update error:", err);
      toast.error("Update failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStatus("");
    setPlannedOverride("");
    setNextStepPlanned("");
    setFiles({});
    onClose();
  };

  const isProcessing = uploading || submitting;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content step4-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="bi bi-clipboard-data" style={{ marginRight: 8 }}></i>
            Step 4: Conceptual Plan + Fill The Form
          </h3>
          <button className="close-btn" onClick={handleClose} disabled={isProcessing}>
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
              <span className="info-value">{lead.step4Planned}</span>
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

          {/* Existing File Links */}
          {(lead.step4TypeOfProject || lead.step4CadFile || lead.step4CalcLink) && (
            <div className="existing-files-card">
              <h4 style={{ marginBottom: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                <i className="bi bi-paperclip" style={{ marginRight: 6 }}></i>
                Uploaded Files
              </h4>
              {lead.step4TypeOfProject && (
                <div className="file-link-row">
                  <span>Type Of Project:</span>
                  <a href={lead.step4TypeOfProject} target="_blank" rel="noopener noreferrer">
                    <i className="bi bi-box-arrow-up-right"></i> View
                  </a>
                </div>
              )}
              {lead.step4CadFile && (
                <div className="file-link-row">
                  <span>CAD File:</span>
                  <a href={lead.step4CadFile} target="_blank" rel="noopener noreferrer">
                    <i className="bi bi-box-arrow-up-right"></i> View
                  </a>
                </div>
              )}
              {lead.step4CalcLink && (
                <div className="file-link-row">
                  <span>Calculation Link:</span>
                  <a href={lead.step4CalcLink} target="_blank" rel="noopener noreferrer">
                    <i className="bi bi-box-arrow-up-right"></i> View
                  </a>
                </div>
              )}
            </div>
          )}

          {/* File Uploads Section */}
          <div className="file-uploads">
            <h4 style={{ marginBottom: 12, color: "var(--text-primary)" }}>
              <i className="bi bi-cloud-upload" style={{ marginRight: 6 }}></i>
              Upload / Update Files
            </h4>

            {FILE_FIELDS.map((field) => (
              <div key={field.key} className="file-upload-row">
                <label className="file-label">{field.label}</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileChange(field.key, e.target.files)}
                    disabled={isProcessing}
                    id={`file-step4-${field.key}`}
                  />
                  <label htmlFor={`file-step4-${field.key}`} className="file-input-btn">
                    <i className="bi bi-upload"></i>
                    {getFileNames(files[field.key])}
                  </label>
                  {files[field.key] && files[field.key].length > 0 && (
                    <button
                      className="file-clear-btn"
                      onClick={() => handleFileChange(field.key, null)}
                      disabled={isProcessing}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Upload Button (independent of status) */}
            <button
              className="btn btn-upload-files"
              onClick={handleUploadFiles}
              disabled={isProcessing || Object.values(files).every((f) => !f || f.length === 0)}
            >
              {uploading ? (
                <>
                  <span className="spinner-small"></span> {uploadProgress}
                </>
              ) : (
                <>
                  <i className="bi bi-cloud-arrow-up" style={{ marginRight: 6 }}></i>
                  Upload Files
                </>
              )}
            </button>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border-primary)", margin: "20px 0" }} />

          {/* Status Selection */}
          <div className="form-group">
            <label>
              <i className="bi bi-flag" style={{ marginRight: 6 }}></i>
              Status <span className="required">*</span>
            </label>
            <div className="status-options">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`status-option ${status === opt.value ? "selected" : ""}`}
                  onClick={() => setStatus(opt.value)}
                  disabled={isProcessing}
                  style={{ "--option-color": opt.color }}
                >
                  <i className={`bi ${opt.icon}`}></i>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Next Step Planned Date — only shows when Done is selected */}
          {status === "Done" && (
            <div className="form-group next-step-planned-group">
              <label>
                <i className="bi bi-calendar-plus" style={{ marginRight: 6 }}></i>
                Step 5 Planned Date & Time <span className="required">*</span>
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={nextStepPlanned}
                onChange={(e) => setNextStepPlanned(e.target.value)}
                disabled={isProcessing}
              />
              <small className="form-hint">This will be the Planned date for Step 5: Proposal</small>
            </div>
          )}

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
            />
            <small className="form-hint">Leave empty to keep current planned date</small>
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
          <button className="btn btn-cancel" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmitStatus}
            disabled={isProcessing || (!status && !plannedOverride)}
          >
            {submitting ? (
              <>
                <span className="spinner-small"></span> Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg" style={{ marginRight: 4 }}></i>
                Submit Status
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ TAB CONTENT COMPONENT ============
export default function Step4({ currentUser, onNextAction }) {
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch Step 4 leads
  const { data, isLoading, error } = useQuery({
    queryKey: ["fms-step4"],
    queryFn: () => api.get("/fms/step4").then((r) => r.data),
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
    queryClient.invalidateQueries(["fms-step4"]);
    queryClient.invalidateQueries(["fms-step5"]);
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
          <span>Loading Step 4 leads...</span>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-inbox"></i>
          <p>No leads pending in Step 4</p>
          <small>Leads will appear here when Step 3 is complete and Step 4 Planned date is set</small>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="lead-table">
            <thead>
              <tr>
                {STEP4_COLUMNS.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.enqNo}>
                  {STEP4_COLUMNS.map((col) => (
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
                        onClick={() => onNextAction(lead, "FMS", "Step 4: Conceptual Plan")}
                        title="Next Action Plan"
                      >
                        <i className="bi bi-ticket-perforated"></i>
                        NAP
                      </button>
                    )}
                    <button
                      className="btn btn-action"
                      onClick={() => handleAction(lead)}
                      title="Update Step 4"
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

      {/* Step 4 Modal */}
      <Step4Modal
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