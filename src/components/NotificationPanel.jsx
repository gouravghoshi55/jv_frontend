import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api.js";

export default function NotificationPanel({ currentUser, onTicketClick }) {
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["my-tickets", currentUser?.userName],
    queryFn: async () => {
      const res = await api.get("/next-action-plan/my-tickets", {
        params: { userName: currentUser?.userName },
      });
      return res.data.tickets || [];
    },
    enabled: !!currentUser?.userName,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const tickets = data || [];

  const isOverdue = (ticket) => {
    if (ticket.status?.toLowerCase() === "completed") return false;
    const checkDate = ticket.revisedDate || ticket.confirmedDate || ticket.desiredDate;
    if (!checkDate) return false;
    return new Date() > new Date(checkDate);
  };

  const overdueCount = tickets.filter(isOverdue).length;
  const activeCount = tickets.filter(
    (t) => t.status?.toLowerCase() !== "completed"
  ).length;

  const getStatusColor = (status) => {
    const map = {
      Open: "var(--accent-yellow)",
      "PC Confirmed": "var(--accent-blue)",
      "In Progress": "var(--accent-hover)",
      "Date Revision Requested": "var(--accent-orange)",
      Completed: "var(--accent-green)",
      Overdue: "var(--accent-red)",
    };
    return map[status] || "var(--text-muted)";
  };

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

  return (
    <div className="notification-panel-wrapper">
      {/* Bell Button */}
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        title="My Assigned Tickets"
      >
        <i className="bi bi-bell-fill"></i>
        {activeCount > 0 && (
          <span className={`notification-badge ${overdueCount > 0 ? "badge-danger" : ""}`}>
            {activeCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="notification-backdrop" onClick={() => setIsOpen(false)} />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h4>
                <i className="bi bi-ticket-perforated"></i> My Tickets
              </h4>
              {overdueCount > 0 && (
                <span className="overdue-alert">
                  <i className="bi bi-exclamation-triangle-fill"></i> {overdueCount} overdue
                </span>
              )}
            </div>

            <div className="notification-list">
              {isLoading ? (
                <div className="notification-loading">
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                  <span style={{ marginLeft: 8 }}>Loading...</span>
                </div>
              ) : tickets.length === 0 ? (
                <div className="notification-empty">
                  <i className="bi bi-inbox"></i>
                  <p>No assigned tickets</p>
                </div>
              ) : (
                tickets
                  .sort((a, b) => {
                    const aOv = isOverdue(a);
                    const bOv = isOverdue(b);
                    if (aOv && !bOv) return -1;
                    if (!aOv && bOv) return 1;
                    return new Date(a.desiredDate) - new Date(b.desiredDate);
                  })
                  .map((ticket) => {
                    const ov = isOverdue(ticket);
                    const displayStatus = ov ? "Overdue" : ticket.status;
                    return (
                      <div
                        key={ticket.ticketId}
                        className={`notification-item ${ov ? "overdue" : ""}`}
                        onClick={() => {
                          onTicketClick?.(ticket);
                          setIsOpen(false);
                        }}
                      >
                        <div className="notif-top">
                          <span className="notif-ticket-id">{ticket.ticketId}</span>
                          <span
                            className="notif-status"
                            style={{ color: getStatusColor(displayStatus) }}
                          >
                            <i className={getStatusIcon(displayStatus)}></i>
                            {displayStatus}
                          </span>
                        </div>
                        <div className="notif-client">
                          {ticket.clientName} — {ticket.enqNo}
                        </div>
                        <div className="notif-desc">
                          {ticket.issueDescription?.substring(0, 80)}
                          {ticket.issueDescription?.length > 80 ? "..." : ""}
                        </div>
                        <div className="notif-date">
                          <i className="bi bi-calendar3"></i>
                          Due: {ticket.revisedDate || ticket.confirmedDate || ticket.desiredDate}
                        </div>
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