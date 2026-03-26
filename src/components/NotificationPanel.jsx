import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api.js";

export default function NotificationPanel({ currentUser, onTicketClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("assigned");

  // Fetch ALL tickets
  const { data, isLoading } = useQuery({
    queryKey: ["all-tickets-panel", currentUser?.userName],
    queryFn: async () => {
      const res = await api.get("/next-action-plan/list");
      return res.data.tickets || [];
    },
    enabled: !!currentUser?.userName,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const allTickets = data || [];

  const assignedToMe = allTickets.filter(
    (t) => t.assignedTo?.toLowerCase() === currentUser?.userName?.toLowerCase()
  );

  const raisedByMe = allTickets.filter(
    (t) => t.raisedBy?.toLowerCase() === currentUser?.userName?.toLowerCase()
  );

  const currentList = activeTab === "assigned" ? assignedToMe : raisedByMe;

  const isOverdue = (ticket) => {
    if (ticket.status?.toLowerCase() === "completed") return false;
    const checkDate = ticket.revisedDate || ticket.confirmedDate || ticket.desiredDate;
    if (!checkDate) return false;
    return new Date() > new Date(checkDate);
  };

  const activeAssignedCount = assignedToMe.filter(
    (t) => t.status?.toLowerCase() !== "completed"
  ).length;

  const overdueCount = assignedToMe.filter(isOverdue).length;

  const getStats = (list) => ({
    total: list.length,
    open: list.filter((t) => t.status === "Open").length,
    confirmed: list.filter((t) => t.status === "PC Confirmed").length,
    inProgress: list.filter((t) => t.status === "In Progress").length,
    revision: list.filter((t) => t.status === "Date Revision Requested").length,
    completed: list.filter((t) => t.status === "Completed").length,
    overdue: list.filter(isOverdue).length,
  });

  const stats = getStats(currentList);

  const getStatusIcon = (status) => {
    const map = {
      Open: "bi-circle",
      "PC Confirmed": "bi-check-circle",
      "In Progress": "bi-arrow-repeat",
      "Date Revision Requested": "bi-calendar-event",
      Completed: "bi-check-circle-fill",
      Overdue: "bi-exclamation-triangle-fill",
    };
    return map[status] || "bi-circle";
  };

  const getStatusBadgeClass = (status) => {
    const map = {
      Open: "badge-open",
      "PC Confirmed": "badge-confirmed",
      "In Progress": "badge-progress",
      "Date Revision Requested": "badge-revision",
      Completed: "badge-completed",
      Overdue: "badge-overdue",
    };
    return map[status] || "badge-default";
  };

  const sortedList = [...currentList].sort((a, b) => {
    const aOv = isOverdue(a);
    const bOv = isOverdue(b);
    if (aOv && !bOv) return -1;
    if (!aOv && bOv) return 1;
    const aComp = a.status === "Completed";
    const bComp = b.status === "Completed";
    if (!aComp && bComp) return -1;
    if (aComp && !bComp) return 1;
    return new Date(a.desiredDate || 0) - new Date(b.desiredDate || 0);
  });

  return (
    <div className="notification-panel-wrapper">
      {/* Bell Button */}
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="My Tickets"
      >
        <i className="bi bi-bell-fill"></i>
        {activeAssignedCount > 0 && (
          <span className={`notification-badge ${overdueCount > 0 ? "badge-danger" : ""}`}>
            {activeAssignedCount}
          </span>
        )}
      </button>

      {/* Half-screen Slide Panel */}
      {isOpen && (
        <>
          <div className="notif-panel-backdrop" onClick={() => setIsOpen(false)} />
          <div className="notif-panel">
            {/* Header */}
            <div className="notif-panel-header">
              <h3>
                <i className="bi bi-ticket-perforated" style={{ marginRight: 8 }}></i>
                My Tickets
              </h3>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                &times;
              </button>
            </div>

            {/* Two Tabs */}
            <div className="notif-panel-tabs">
              <button
                className={`notif-tab ${activeTab === "assigned" ? "active" : ""}`}
                onClick={() => setActiveTab("assigned")}
              >
                <i className="bi bi-person-check" style={{ marginRight: 6 }}></i>
                Assigned to Me
                <span className="notif-tab-count">{assignedToMe.length}</span>
              </button>
              <button
                className={`notif-tab ${activeTab === "raised" ? "active" : ""}`}
                onClick={() => setActiveTab("raised")}
              >
                <i className="bi bi-send" style={{ marginRight: 6 }}></i>
                Raised by Me
                <span className="notif-tab-count">{raisedByMe.length}</span>
              </button>
            </div>

            {/* Mini Stats */}
            <div className="notif-panel-stats">
              <div className="notif-stat">
                <span className="notif-stat-num">{stats.total}</span>
                <span className="notif-stat-label">Total</span>
              </div>
              <div className="notif-stat">
                <span className="notif-stat-num" style={{ color: "var(--accent-yellow)" }}>{stats.open}</span>
                <span className="notif-stat-label">Open</span>
              </div>
              <div className="notif-stat">
                <span className="notif-stat-num" style={{ color: "var(--accent-hover)" }}>{stats.inProgress}</span>
                <span className="notif-stat-label">Progress</span>
              </div>
              <div className="notif-stat">
                <span className="notif-stat-num" style={{ color: "var(--accent-green)" }}>{stats.completed}</span>
                <span className="notif-stat-label">Done</span>
              </div>
              {stats.overdue > 0 && (
                <div className="notif-stat">
                  <span className="notif-stat-num" style={{ color: "var(--accent-red)" }}>{stats.overdue}</span>
                  <span className="notif-stat-label">Overdue</span>
                </div>
              )}
            </div>

            {/* Ticket List */}
            <div className="notif-panel-list">
              {isLoading ? (
                <div className="notification-loading">
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                  <span style={{ marginLeft: 8 }}>Loading...</span>
                </div>
              ) : sortedList.length === 0 ? (
                <div className="notification-empty">
                  <i className="bi bi-inbox"></i>
                  <p>
                    {activeTab === "assigned"
                      ? "No tickets assigned to you"
                      : "You haven't raised any tickets"}
                  </p>
                </div>
              ) : (
                sortedList.map((ticket) => {
                  const ov = isOverdue(ticket);
                  const displayStatus = ov ? "Overdue" : ticket.status;
                  return (
                    <div
                      key={ticket.ticketId}
                      className={`notif-panel-item ${ov ? "overdue" : ""} ${ticket.status === "Completed" ? "completed" : ""}`}
                      onClick={() => {
                        onTicketClick?.(ticket);
                        setIsOpen(false);
                      }}
                    >
                      <div className="notif-item-top">
                        <span className="notif-item-id">{ticket.ticketId}</span>
                        <span className={`badge ${getStatusBadgeClass(displayStatus)}`}>
                          <i className={getStatusIcon(displayStatus)} style={{ marginRight: 4 }}></i>
                          {displayStatus}
                        </span>
                      </div>

                      <div className="notif-item-client">
                        {ticket.clientName} — {ticket.enqNo}
                      </div>

                      <div className="notif-item-issue">{ticket.issueDescription}</div>

                      <div className="notif-item-meta">
                        <span>
                          <i className="bi bi-calendar3"></i>
                          Due: {ticket.revisedDate || ticket.confirmedDate || ticket.desiredDate || "—"}
                        </span>
                        {activeTab === "raised" && (
                          <span>
                            <i className="bi bi-person"></i>
                            Assigned: {ticket.assignedTo}
                          </span>
                        )}
                        {activeTab === "assigned" && (
                          <span>
                            <i className="bi bi-person"></i>
                            Raised: {ticket.raisedBy}
                          </span>
                        )}
                        <span>
                          <i className="bi bi-tag"></i>
                          {ticket.sourceTab}{ticket.stepName ? ` / ${ticket.stepName}` : ""}
                        </span>
                      </div>

                      {parseInt(ticket.revisionCount) > 0 && (
                        <div className="notif-item-revision">
                          <i className="bi bi-arrow-repeat" style={{ marginRight: 4 }}></i>
                          {ticket.revisionCount} revision(s) — Last: {ticket.revisedDate}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}