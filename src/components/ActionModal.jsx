import React, { useState } from "react";

export default function ActionModal({ lead, statusOptions, onSubmit, onClose, loading }) {
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState(lead?.remarks || "");

  const handleSubmit = () => {
    if (!status) return;
    onSubmit({ enqNo: lead.enqNo, status, remarks });
  };

  if (!lead) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="bi bi-pencil-square" style={{ marginRight: 8, color: "var(--accent-primary)" }}></i>
            Update Lead
          </h3>
          <button className="modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="modal-body">
          {/* Lead Info */}
          <div className="lead-info">
            <div className="lead-info-row">
              <span className="label">EnQ No</span>
              <span className="value" style={{ color: "var(--accent-primary)" }}>{lead.enqNo}</span>
            </div>
            <div className="lead-info-row">
              <span className="label">Client</span>
              <span className="value">{lead.clientName}</span>
            </div>
            <div className="lead-info-row">
              <span className="label">Location</span>
              <span className="value">{lead.location}</span>
            </div>
            <div className="lead-info-row">
              <span className="label">Contact</span>
              <span className="value">{lead.contactInfo || "—"}</span>
            </div>
            <div className="lead-info-row">
              <span className="label">Concern Person</span>
              <span className="value">{lead.concernPerson}</span>
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="form-group">
            <label>Status</label>
            <select
              className="form-control"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">-- Select Status --</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Remarks */}
          <div className="form-group">
            <label>Remarks</label>
            <textarea
              className="form-control"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add remarks..."
              rows={3}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!status || loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg"></i>
                Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}