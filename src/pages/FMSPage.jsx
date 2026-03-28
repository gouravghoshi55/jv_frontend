import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api.js";
import Step2Modal from "../components/Step2Modal.jsx";
import NextActionModal from "../components/NextActionModal.jsx";

const FMS_STEPS = [
  { id: 2, label: "Document Upload", icon: "bi-cloud-upload" },
  { id: 3, label: "Need Analysis Meeting", icon: "bi-people" },
  { id: 4, label: "Conceptual Plan + Form", icon: "bi-clipboard-data" },
  { id: 5, label: "Final Conceptual Plan", icon: "bi-file-earmark-check" },
  { id: 6, label: "Project Calculation", icon: "bi-calculator" },
  { id: 7, label: "Full Kitting", icon: "bi-box-seam" },
  { id: 8, label: "Proposal Meeting", icon: "bi-briefcase" },
  { id: 9, label: "Negotiation / Agreement", icon: "bi-handshake" },
];

// Step 2 columns to display
const STEP2_COLUMNS = [
  { key: "enqNo", label: "EnQ No" },
  { key: "clientName", label: "Client Name" },
  { key: "partnerType", label: "Partner Type" },
  { key: "purpose", label: "Purpose" },
  { key: "location", label: "Location" },
  { key: "contactInfo", label: "Contact Info" },
  { key: "concernPerson", label: "Concern Person" },
  { key: "planned", label: "Planned Date" },
];

export default function FMSPage({ currentUser }) {
  const [activeStep, setActiveStep] = useState(2);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showStep2Modal, setShowStep2Modal] = useState(false);
  const [showNAPModal, setShowNAPModal] = useState(false);
  const [napLead, setNapLead] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  // Fetch Step 2 leads
  const { data, isLoading, error } = useQuery({
    queryKey: ["fms-step2"],
    queryFn: () => api.get("/fms/step2").then((r) => r.data),
    enabled: activeStep === 2,
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
    setShowStep2Modal(true);
  };

  const handleNAP = (lead) => {
    setNapLead(lead);
    setShowNAPModal(true);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries(["fms-step2"]);
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <i className="bi bi-diagram-3" style={{ marginRight: 10, color: "var(--accent-purple)" }}></i>
          FMS — Follow-up Management
        </h2>
        <span className="badge badge-purple">{filteredLeads.length} leads</span>
      </div>

      {/* Sub-step tabs */}
      <div className="fms-sub-tabs">
        {FMS_STEPS.map((step) => (
          <button
            key={step.id}
            className={`fms-sub-tab ${activeStep === step.id ? "active" : ""}`}
            onClick={() => setActiveStep(step.id)}
          >
            <i className={`bi ${step.icon}`} style={{ marginRight: 6 }}></i>
            Step {step.id}: {step.label}
          </button>
        ))}
      </div>

      {/* Step 2 Content */}
      {activeStep === 2 && (
        <div className="step-content">
          {/* Search */}
          <div className="filter-bar">
            <input
              type="text"
              className="filter-input"
              placeholder="Search by EnQ No, client, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="error-msg">
              <i className="bi bi-exclamation-triangle"></i>
              Failed to load: {error.message}
            </div>
          )}

          {/* Loading */}
          {isLoading ? (
            <div className="loading">
              <div className="spinner"></div>
              <span>Loading Step 2 leads...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-inbox"></i>
              <p>No leads pending in Step 2</p>
              <small>Leads will appear here when Planned date is set and Actual is empty</small>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="lead-table">
                <thead>
                  <tr>
                    {STEP2_COLUMNS.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.enqNo}>
                      {STEP2_COLUMNS.map((col) => (
                        <td key={col.key}>{lead[col.key] || "—"}</td>
                      ))}
                      <td className="actions-cell">
                        <button
                          className="btn btn-nap"
                          onClick={() => handleNAP(lead)}
                          title="Next Action Plan"
                        >
                          <i className="bi bi-ticket-perforated"></i>
                          NAP
                        </button>
                        <button
                          className="btn btn-action"
                          onClick={() => handleAction(lead)}
                          title="Upload Documents"
                        >
                          <i className="bi bi-cloud-upload"></i>
                          Action
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Other steps placeholder */}
      {activeStep !== 2 && (
        <div className="step-placeholder">
          <i className={`bi ${FMS_STEPS.find((s) => s.id === activeStep)?.icon}`}></i>
          <h3>Step {activeStep}: {FMS_STEPS.find((s) => s.id === activeStep)?.label}</h3>
          <p>This step will be implemented next.</p>
        </div>
      )}

      {/* Step 2 Modal */}
      <Step2Modal
        show={showStep2Modal}
        lead={selectedLead}
        onClose={() => {
          setShowStep2Modal(false);
          setSelectedLead(null);
        }}
        onSuccess={handleSuccess}
      />

      {/* NAP Modal */}
      {showNAPModal && napLead && (
        <NextActionModal
          show={showNAPModal}
          lead={napLead}
          sourceTab="FMS"
          stepName="Step 2: Document Upload"
          currentUser={currentUser}
          onClose={() => {
            setShowNAPModal(false);
            setNapLead(null);
          }}
          onSuccess={() => {
            setShowNAPModal(false);
            setNapLead(null);
          }}
        />
      )}
    </div>
  );
}