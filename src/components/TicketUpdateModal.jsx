import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../api.js";

export default function TicketUpdateModal({ show, onClose, ticket, currentUser, onUpdated }) {
  const [status, setStatus] = useState("");
  const [confirmedDate, setConfirmedDate] = useState("");
  const [revisedDate, setRevisedDate] = useState("");
  const [pcRemarks, setPcRemarks] = useState("");
  const [doerRemarks, setDoerRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = currentUser?.role?.toLowerCase() === "admin";
  const isAssignedDoer =
    currentUser?.userName?.toLowerCase() === ticket?.assignedTo?.toLowerCase();

  useEffect(() => {
    if (show && ticket) {
      setStatus(ticket.status || "");
      setConfirmedDate(ticket.confirmedDate || "");
      setRevisedDate(ticket.revisedDate || "");
      setPcRemarks(ticket.pcRemarks || "");
      setDoerRemarks(ticket.doerRemarks || "");
    }
  }, [show, ticket]);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const payload = { rowIndex: ticket.rowIndex };

      if (isAdmin) {
        if (status !== ticket.status) payload.status = status;
        if (confirmedDate !== ticket.confirmedDate) payload.confirmedDate = confirmedDate;
        if (pcRemarks !== ticket.pcRemarks) payload.pcRemarks = pcRemarks;
        if (revisedDate !== ticket.revisedDate) payload.revisedDate = revisedDate;
      }

      if (isAssignedDoer) {
        if (doerRemarks !== ticket.doerRemarks) payload.doerRemarks = doerRemarks;
        if (status === "Date Revision Requested" && revisedDate) {
          payload.status = "Date Revision Requested";
          payload.revisedDate = revisedDate;
        }
        if (status === "Completed") {
          payload.status = "Completed";
        }
        if (status === "Rejected") {
          if (!doerRemarks || doerRemarks.trim() === "" || doerRemarks === ticket.doerRemarks) {
            toast.warn("Please provide a reason for rejection in Doer Remarks");
            setLoading(false);
            return;
          }
          payload.status = "Rejected";
        }
      }

      const res = await api.post("/next-action-plan/update", payload);
      if (res.data.success) {
        toast.success("Ticket updated successfully!");
        onUpdated?.();
        onClose();
      } else {
        toast.error(res.data.error || "Update failed");
      }
    } catch (err) {
      console.error("Error updating ticket:", err);
      toast.error("Failed to update ticket");
    } finally {
      setLoading(false);
    }
  };

  if (!show || !ticket) return null;

  const getStatusOptions = () => {
    if (isAdmin) {
      return ["Open", "PC Confirmed", "In Progress", "Date Revision Requested", "Completed", "Rejected", "Overdue"];
    }
    if (isAssignedDoer) {
      const current = ticket.status;
      if (current === "PC Confirmed" || current === "In Progress") {
        return [current, "In Progress", "Date Revision Requested", "Completed", "Rejected"];
      }
      if (current === "Date Revision Requested") {
        return [current, "In Progress", "Completed", "Rejected"];
      }
      return [current, "Date Revision Requested", "Completed", "Rejected"];
    }
    return [ticket.status];
  };

  const getStatusBadgeClass = (s) => {
    const map = {
      Open: "badge-open",
      "PC Confirmed": "badge-confirmed",
      "In Progress": "badge-progress",
      "Date Revision Requested": "badge-revision",
      Completed: "badge-completed",
      Rejected: "badge-rejected",
      Overdue: "badge-overdue",
    };
    return map[s] || "badge-default";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content ticket-update-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>
            <i className="bi bi-pencil-square" style={{ marginRight: 8 }}></i>
            Update Ticket: {ticket.ticketId}
          </h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Ticket Summary */}
          <div className="ticket-summary">
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">EnQ No</span>
                <span className="value">{ticket.enqNo}</span>
              </div>
              <div className="summary-item">
                <span className="label">Client</span>
                <span className="value">{ticket.clientName}</span>
              </div>
              <div className="summary-item">
                <span className="label">Raised By</span>
                <span className="value">{ticket.raisedBy}</span>
              </div>
              <div className="summary-item">
                <span className="label">Assigned To</span>
                <span className="value">{ticket.assignedTo}</span>
              </div>
              <div className="summary-item">
                <span className="label">Desired Date</span>
                <span className="value">{ticket.desiredDate}</span>
              </div>
              <div className="summary-item">
                <span className="label">Current Status</span>
                <span className={`badge ${getStatusBadgeClass(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
            </div>
            <div className="summary-desc">
              <span className="label">Issue</span>
              <p>{ticket.issueDescription}</p>
            </div>
            {parseInt(ticket.revisionCount) > 0 && (
              <div className="summary-desc" style={{ marginTop: 10 }}>
                <span className="label">
                  Revision History ({ticket.revisionCount} revisions)
                </span>
                <p>{ticket.revisionHistory}</p>
              </div>
            )}
          </div>

          {/* Update Form */}
          <div className="ticket-form">
            <div className="form-group">
              <label>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="form-select"
                disabled={!isAdmin && !isAssignedDoer}
              >
                {getStatusOptions().map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {isAdmin && (
              <div className="form-group">
                <label>Confirmed Date (PC fills after calling doer)</label>
                <input
                  type="date"
                  value={confirmedDate}
                  onChange={(e) => setConfirmedDate(e.target.value)}
                  className="form-input"
                />
              </div>
            )}

            {(status === "Date Revision Requested" || isAdmin) && (
              <div className="form-group">
                <label>Revised Date</label>
                <input
                  type="date"
                  value={revisedDate}
                  onChange={(e) => setRevisedDate(e.target.value)}
                  className="form-input"
                />
              </div>
            )}

            {isAdmin && (
              <div className="form-group">
                <label>PC Remarks</label>
                <textarea
                  value={pcRemarks}
                  onChange={(e) => setPcRemarks(e.target.value)}
                  placeholder="Admin notes..."
                  rows={2}
                  className="form-textarea"
                />
              </div>
            )}

            {isAssignedDoer && (
              <div className="form-group">
                <label>
                  Doer Remarks
                  {status === "Rejected" && <span style={{ color: "var(--accent-red)", marginLeft: 4 }}>* (reason required for rejection)</span>}
                </label>
                <textarea
                  value={doerRemarks}
                  onChange={(e) => setDoerRemarks(e.target.value)}
                  placeholder={status === "Rejected" ? "Why are you rejecting this task?..." : "Your notes / update..."}
                  rows={2}
                  className="form-textarea"
                  style={status === "Rejected" ? { borderColor: "var(--accent-red)" } : {}}
                />
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-small"></span> Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg" style={{ marginRight: 4 }}></i> Update
                Ticket
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}