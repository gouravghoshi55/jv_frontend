import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api.js";
import TicketUpdateModal from "../components/TicketUpdateModal.jsx";

export default function NextActionPlanPage({ currentUser }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const isAdmin = currentUser?.role?.toLowerCase() === "admin";

  // Fetch all tickets
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["next-action-plan-tickets"],
    queryFn: async () => {
      const res = await api.get("/next-action-plan/list");
      return res.data.tickets || [];
    },
    staleTime: 30000,
  });

  // Fetch users for filter dropdown
  const { data: usersData } = useQuery({
    queryKey: ["nap-users"],
    queryFn: async () => {
      const res = await api.get("/next-action-plan/users");
      return res.data.users || [];
    },
    staleTime: 60000,
  });

  const tickets = data || [];
  const users = usersData || [];

  // Filters
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      !search ||
      t.ticketId?.toLowerCase().includes(search.toLowerCase()) ||
      t.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      t.enqNo?.toLowerCase().includes(search.toLowerCase()) ||
      t.issueDescription?.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedTo?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !filterStatus || t.status === filterStatus;
    const matchesAssignee = !filterAssignee || t.assignedTo === filterAssignee;

    return matchesSearch && matchesStatus && matchesAssignee;
  });

  // Stats
  const isOverdue = (ticket) => {
    if (ticket.status === "Completed") return false;
    const checkDate = ticket.revisedDate || ticket.confirmedDate || ticket.desiredDate;
    if (!checkDate) return false;
    return new Date() > new Date(checkDate);
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "Open").length,
    confirmed: tickets.filter((t) => t.status === "PC Confirmed").length,
    inProgress: tickets.filter((t) => t.status === "In Progress").length,
    revision: tickets.filter((t) => t.status === "Date Revision Requested").length,
    completed: tickets.filter((t) => t.status === "Completed").length,
    rejected: tickets.filter((t) => t.status === "Rejected").length,
    overdue: tickets.filter(isOverdue).length,
  };

  const getStatusBadgeClass = (status) => {
    const map = {
      Open: "badge-open",
      "PC Confirmed": "badge-confirmed",
      "In Progress": "badge-progress",
      "Date Revision Requested": "badge-revision",
      Completed: "badge-completed",
      Rejected: "badge-rejected",
      Overdue: "badge-overdue",
    };
    return map[status] || "badge-default";
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setShowUpdateModal(true);
  };

  return (
    <div className="nap-page">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">
          <i className="bi bi-ticket-perforated" style={{ marginRight: 10, color: "var(--accent-primary)" }}></i>
          Next Action Plan
        </h2>
        <span className="badge badge-blue">{filteredTickets.length} tickets</span>
      </div>

      {/* Stats */}
      <div className="nap-stats">
        <div className="stat-card">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-card stat-open">
          <span className="stat-number">{stats.open}</span>
          <span className="stat-label">Open</span>
        </div>
        <div className="stat-card stat-confirmed">
          <span className="stat-number">{stats.confirmed}</span>
          <span className="stat-label">PC Confirmed</span>
        </div>
        <div className="stat-card stat-progress">
          <span className="stat-number">{stats.inProgress}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-card stat-revision">
          <span className="stat-number">{stats.revision}</span>
          <span className="stat-label">Revision Req</span>
        </div>
        <div className="stat-card stat-completed">
          <span className="stat-number">{stats.completed}</span>
          <span className="stat-label">Completed</span>
        </div>
        {stats.overdue > 0 && (
          <div className="stat-card stat-overdue">
            <span className="stat-number">{stats.overdue}</span>
            <span className="stat-label">Overdue</span>
          </div>
        )}
        {stats.rejected > 0 && (
          <div className="stat-card stat-rejected">
            <span className="stat-number">{stats.rejected}</span>
            <span className="stat-label">Rejected</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="nap-filters">
        <div className="search-box">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="PC Confirmed">PC Confirmed</option>
          <option value="In Progress">In Progress</option>
          <option value="Date Revision Requested">Date Revision Requested</option>
          <option value="Completed">Completed</option>
          <option value="Rejected">Rejected</option>
          <option value="Overdue">Overdue</option>
        </select>

        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="filter-select"
        >
          <option value="">All Assignees</option>
          {users.map((u) => (
            <option key={u.id} value={u.userName}>
              {u.userName}
            </option>
          ))}
        </select>

        <button className="btn-refresh" onClick={() => refetch()}>
          <i className="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <span>Loading tickets...</span>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-ticket-perforated"></i>
          <p>No tickets found</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="table-scroll">
            <table className="nap-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>EnQ No</th>
                  <th>Client</th>
                  <th>Raised By</th>
                  <th>Assigned To</th>
                  <th>Issue</th>
                  <th>Desired Date</th>
                  <th>Confirmed</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const ov = isOverdue(ticket);
                  return (
                    <tr key={ticket.ticketId} className={ov ? "row-overdue" : ""}>
                      <td className="ticket-id-cell">{ticket.ticketId}</td>
                      <td className="td-enq">{ticket.enqNo}</td>
                      <td className="td-client">{ticket.clientName}</td>
                      <td>{ticket.raisedBy}</td>
                      <td>{ticket.assignedTo}</td>
                      <td className="issue-cell" title={ticket.issueDescription}>
                        {ticket.issueDescription?.substring(0, 50)}
                        {ticket.issueDescription?.length > 50 ? "..." : ""}
                      </td>
                      <td>{ticket.desiredDate}</td>
                      <td>{ticket.confirmedDate || "—"}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(ov ? "Overdue" : ticket.status)}`}>
                          {ov ? "Overdue" : ticket.status}
                        </span>
                        {parseInt(ticket.revisionCount) > 0 && (
                          <span className="revision-count" title="Revision count">
                            R{ticket.revisionCount}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-source">{ticket.sourceTab}</span>
                        {ticket.stepName && (
                          <span className="badge badge-step">{ticket.stepName}</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-action"
                          onClick={() => handleTicketClick(ticket)}
                          title="Update Ticket"
                        >
                          <i className="bi bi-pencil-square"></i>
                          Update
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Update Modal */}
      <TicketUpdateModal
        show={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        currentUser={currentUser}
        onUpdated={refetch}
      />
    </div>
  );
}