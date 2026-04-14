import React, { useState } from "react";
import Step2Modal from "../components/Step2Modal.jsx";
import Step3 from "./fms/steps/Step3.jsx";
import Step4 from "./fms/steps/step4.jsx";
import Step5 from "./fms/steps/Step5.jsx";
import Step6 from "./fms/steps/step6.jsx";
import Step7 from "./fms/steps/step7.jsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api.js";
import Step1 from "./fms/steps/Step1.jsx";

// ✅ ONLY LABELS CHANGED (IDs SAME - IMPORTANT)
const FMS_STEPS = [
  { id: 2, label: "Document Upload", icon: "bi-cloud-upload" },
  { id: 3, label: "Need Analysis Meeting", icon: "bi-people" },
  { id: 4, label: "Proposal Preparation ", icon: "bi-clipboard-data" },
  { id: 5, label: "Proposal Meeting", icon: "bi-file-earmark-check" },
  { id: 6, label: "Follow Up", icon: "bi-arrow-repeat" },
  { id: 7, label: "Agreement", icon: "bi-handshake" },
];

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

export default function FMSPage({ currentUser, onNextAction }) {
  // ✅ Default = All Leads
  const [activeStep, setActiveStep] = useState(1);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showStep2Modal, setShowStep2Modal] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  // ⚠️ SAME API (no backend change)
  const { data: step2Data, isLoading: step2Loading, error: step2Error } = useQuery({
    queryKey: ["fms-step2"],
    queryFn: () => api.get("/fms/step2").then((r) => r.data),
    enabled: activeStep === 2,
    staleTime: 30000,
  });

  const step2Leads = step2Data?.leads || [];

  const filteredStep2Leads = step2Leads.filter((lead) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (lead.enqNo || "").toLowerCase().includes(q) ||
      (lead.clientName || "").toLowerCase().includes(q) ||
      (lead.location || "").toLowerCase().includes(q) ||
      (lead.concernPerson || "").toLowerCase().includes(q)
    );
  });

  const handleStep2Action = (lead) => {
    setSelectedLead(lead);
    setShowStep2Modal(true);
  };

  const handleStep2Success = () => {
    queryClient.invalidateQueries(["fms-step2"]);
    queryClient.invalidateQueries(["fms-step3"]);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return <Step1 currentUser={currentUser} />; // ✅ All Leads

      case 2:
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
              <span className="result-count">{filteredStep2Leads.length} leads</span>
            </div>

            {step2Error && (
              <div className="error-msg">
                Failed to load: {step2Error.message}
              </div>
            )}

            {step2Loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <span>Loading leads...</span>
              </div>
            ) : filteredStep2Leads.length === 0 ? (
              <div className="empty-state">
                <p>No leads pending in Document Upload</p>
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
                    {filteredStep2Leads.map((lead) => (
                      <tr key={lead.enqNo}>
                        {STEP2_COLUMNS.map((col) => (
                          <td key={col.key}>{lead[col.key] || "—"}</td>
                        ))}
                        <td className="actions-cell">
                          {onNextAction && (
                            <button
                              className="btn btn-nap"
                              onClick={() =>
                                onNextAction(lead, "FMS", "Document Upload")
                              }
                            >
                              NAP
                            </button>
                          )}
                          <button
                            className="btn btn-action"
                            onClick={() => handleStep2Action(lead)}
                          >
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
        );

      case 3:
        return <Step3 currentUser={currentUser} onNextAction={onNextAction} />;

      case 4:
        return <Step4 currentUser={currentUser} onNextAction={onNextAction} />;

      case 5:
        return <Step5 currentUser={currentUser} onNextAction={onNextAction} />;

      case 6:
        return <Step6 currentUser={currentUser} onNextAction={onNextAction} />;

      case 7:
        return <Step7 currentUser={currentUser} onNextAction={onNextAction} />;

      default:
        return <div>No Step Found</div>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">FMS — Follow-up Management</h2>
      </div>

      <div className="fms-sub-tabs">
  {/* All Leads */}
  <button
    className={`fms-sub-tab ${activeStep === 1 ? "active" : ""}`}
    onClick={() => {
      setActiveStep(1);
      setSearch("");
    }}
  >
    <i className="bi bi-list"></i> All Leads
  </button>

  {/* Steps with numbering */}
  {FMS_STEPS.map((step, index) => (
    <button
      key={step.id}
      className={`fms-sub-tab ${activeStep === step.id ? "active" : ""}`}
      onClick={() => {
        setActiveStep(step.id);
        setSearch("");
      }}
    >
      <i className={`bi ${step.icon}`} style={{ marginRight: 6 }}></i>
      Step {index + 1}: {step.label}
    </button>
  ))}
</div>

      {renderStepContent()}

      <Step2Modal
        show={showStep2Modal}
        lead={selectedLead}
        onClose={() => {
          setShowStep2Modal(false);
          setSelectedLead(null);
        }}
        onSuccess={handleStep2Success}
      />
    </div>
  );
}