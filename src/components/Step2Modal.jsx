import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../api.js";

const FILE_FIELDS = [
  { key: "mapLocation", label: "Map Location", colIndex: 13 },
  { key: "aks", label: "Aks", colIndex: 14 },
  { key: "khasra", label: "Khasra", colIndex: 15 },
  { key: "oldDocument", label: "Any OLD Document/Layout Plan", colIndex: 16 },
  { key: "landSurvey", label: "Land Survey", colIndex: 17 },
];

export default function Step2Modal({ show, lead, onClose, onSuccess }) {
  const [files, setFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  if (!show || !lead) return null;

  const handleFileChange = (key, file) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

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

  const handleSubmit = async () => {
    const selectedFiles = Object.entries(files).filter(([_, file]) => file);
    
    if (selectedFiles.length === 0) {
      toast.warn("Please select at least one file to upload");
      return;
    }

    setUploading(true);

    try {
      // Step 1: Create folder and mark as Done
      setProgress("Creating folder...");
      const initRes = await api.post("/fms/step2/update", {
        rowIndex: lead.rowIndex,
        enqNo: lead.enqNo,
        location: lead.location,
      });

      if (!initRes.data.success) {
        throw new Error(initRes.data.error || "Failed to initialize");
      }

      const folderId = initRes.data.folderId;

      // Step 2: Upload each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const [key, file] = selectedFiles[i];
        const fieldInfo = FILE_FIELDS.find((f) => f.key === key);
        
        setProgress(`Uploading ${fieldInfo.label} (${i + 1}/${selectedFiles.length})...`);

        const base64 = await fileToBase64(file);

        await api.post("/fms/upload", {
          rowIndex: lead.rowIndex,
          folderId: folderId,
          columnIndex: fieldInfo.colIndex,
          fileName: `${lead.enqNo}_${fieldInfo.key}.pdf`,
          fileBase64: base64,
          mimeType: file.type || "application/pdf",
        });
      }

      toast.success("Documents uploaded successfully!");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed: " + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content step2-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="bi bi-cloud-upload" style={{ marginRight: 8 }}></i>
            Step 2: Document Upload
          </h3>
          <button className="close-btn" onClick={onClose} disabled={uploading}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* Lead Info */}
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
              <span className="info-value">{lead.planned}</span>
            </div>
          </div>

          {/* Status Selection */}
          <div className="form-group">
            <label>Status</label>
            <select className="form-select" value="Done" disabled>
              <option value="Done">Done</option>
            </select>
          </div>

          {/* File Uploads */}
          <div className="file-uploads">
            <h4 style={{ marginBottom: 12, color: "var(--text-primary)" }}>
              <i className="bi bi-file-earmark-pdf" style={{ marginRight: 6 }}></i>
              Upload Documents (PDF)
            </h4>

            {FILE_FIELDS.map((field) => (
              <div key={field.key} className="file-upload-row">
                <label className="file-label">{field.label}</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(field.key, e.target.files[0])}
                    disabled={uploading}
                    id={`file-${field.key}`}
                  />
                  <label htmlFor={`file-${field.key}`} className="file-input-btn">
                    <i className="bi bi-upload"></i>
                    {files[field.key] ? files[field.key].name : "Choose PDF"}
                  </label>
                  {files[field.key] && (
                    <button
                      className="file-clear-btn"
                      onClick={() => handleFileChange(field.key, null)}
                      disabled={uploading}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Progress */}
          {uploading && progress && (
            <div className="upload-progress">
              <div className="spinner-small"></div>
              <span>{progress}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-cancel" onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={uploading}>
            {uploading ? (
              <>
                <span className="spinner-small"></span> Uploading...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg" style={{ marginRight: 4 }}></i>
                Submit & Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}