import React, { useState } from "react";
import Step2Modal from "../components/Step2Modal.jsx";
import Step3 from "./fms/steps/Step3.jsx";
import Step4 from "./fms/steps/Step4.jsx";
import Step5 from "./fms/steps/Step5.jsx";
import Step6 from "./fms/steps/Step6.jsx";
import Step7 from "./fms/steps/Step7.jsx";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api.js";

const FMS_STEPS = [
  { id: 1, label: "FMS Leads", icon: "bi-file-earmark-check" },
  { id: 2, label: "Document Upload", icon: "bi-cloud-upload" },
  { id: 3, label: "Need Analysis Meeting", icon: "bi-people" },
  { id: 4, label: "Proposal Preparation", icon: "bi-clipboard-data" },
  { id: 5, label: "Proposal", icon: "bi-file-earmark-check" },
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
  const [activeStep, setActiveStep] = useState(2);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showStep2Modal, setShowStep2Modal] = useState(false);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

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

  const handleStep2Action = (lead) => { setSelectedLead(lead); setShowStep2Modal(true); };
  const handleStep2Success = () => { queryClient.invalidateQueries(["fms-step2"]); queryClient.invalidateQueries(["fms-step3"]); };

  const renderStepContent = () => {
    switch (activeStep) {
      case 2:
        return (
          <div className="step-content">
            <div className="filter-bar">
              <div className="search-box">
                <i className="bi bi-search"></i>
                <input type="text" className="filter-input" placeholder="Search by EnQ No, client, location..." value={search} onChange={(e) => setSearch(e.target.value)} />
                {search && <button className="search-clear" onClick={() => setSearch("")}><i className="bi bi-x"></i></button>}
              </div>
              <span className="result-count">{filteredStep2Leads.length} leads</span>
            </div>
            {step2Error && <div className="error-msg"><i className="bi bi-exclamation-triangle"></i>Failed to load: {step2Error.message}</div>}
            {step2Loading ? (
              <div className="loading"><div className="spinner"></div><span>Loading Step 2 leads...</span></div>
            ) : filteredStep2Leads.length === 0 ? (
              <div className="empty-state"><i className="bi bi-inbox"></i><p>No leads pending in Step 2</p><small>Leads will appear here when Planned date is set and Actual is empty</small></div>
            ) : (
              <div className="table-wrapper">
                <table className="lead-table">
                  <thead><tr>{STEP2_COLUMNS.map((col) => <th key={col.key}>{col.label}</th>)}<th>Actions</th></tr></thead>
                  <tbody>
                    {filteredStep2Leads.map((lead) => (
                      <tr key={lead.enqNo}>
                        {STEP2_COLUMNS.map((col) => <td key={col.key}>{lead[col.key] || "—"}</td>)}
                        <td className="actions-cell">
                          {onNextAction && <button className="btn btn-nap" onClick={() => onNextAction(lead, "FMS", "Step 2: Document Upload")} title="Next Action Plan"><i className="bi bi-ticket-perforated"></i>NAP</button>}
                          <button className="btn btn-action" onClick={() => handleStep2Action(lead)} title="Upload Documents"><i className="bi bi-cloud-upload"></i>Action</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 3: return <Step3 currentUser={currentUser} onNextAction={onNextAction} />;
      case 4: return <Step4 currentUser={currentUser} onNextAction={onNextAction} />;
      case 5: return <Step5 currentUser={currentUser} onNextAction={onNextAction} />;
      case 6: return <Step6 currentUser={currentUser} onNextAction={onNextAction} />;
      case 7: return <Step7 currentUser={currentUser} onNextAction={onNextAction} />;

      default:
        return (
          <div className="step-placeholder">
            <i className={`bi ${FMS_STEPS.find((s) => s.id === activeStep)?.icon}`}></i>
            <h3>Step {activeStep}: {FMS_STEPS.find((s) => s.id === activeStep)?.label}</h3>
            <p>This step will be implemented next.</p>
          </div>
        );
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <i className="bi bi-diagram-3" style={{ marginRight: 10, color: "var(--accent-purple)" }}></i>
          FMS — Follow-up Management
        </h2>
      </div>

      <div className="fms-sub-tabs">
        {FMS_STEPS.map((step) => (
          <button
            key={step.id}
            className={`fms-sub-tab ${activeStep === step.id ? "active" : ""}`}
            onClick={() => { setActiveStep(step.id); setSearch(""); }}
          >
            <i className={`bi ${step.icon}`} style={{ marginRight: 6 }}></i>
            Step {step.id}: {step.label}
          </button>
        ))}
      </div>

      {renderStepContent()}

      <Step2Modal
        show={showStep2Modal}
        lead={selectedLead}
        onClose={() => { setShowStep2Modal(false); setSelectedLead(null); }}
        onSuccess={handleStep2Success}
      />
    </div>
  );
}