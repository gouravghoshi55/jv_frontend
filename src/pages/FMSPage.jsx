import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api.js";
import LeadTable from "../components/LeadTable.jsx";

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

export default function FMSPage() {
  const [activeStep, setActiveStep] = useState(2);

  const { data, isLoading, error } = useQuery({
    queryKey: ["fms"],
    queryFn: () => api.get("/fms/list").then((r) => r.data),
  });

  const leads = data?.leads || [];

  // TODO: When FMS column structure is provided, filter leads by step
  // For now, show all FMS leads in every step
  // Each step will check specific columns to determine which leads belong to that step

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <i className="bi bi-diagram-3" style={{ marginRight: 10, color: "var(--accent-purple)" }}></i>
          FMS — Follow-up Management
        </h2>
        <span className="badge badge-purple">{leads.length} leads</span>
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

      {/* Step content */}
      <div style={{ marginTop: 8 }}>
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: 32,
          textAlign: "center",
          color: "var(--text-muted)",
        }}>
          <i className={`bi ${FMS_STEPS.find((s) => s.id === activeStep)?.icon}`} style={{ fontSize: 36, display: "block", marginBottom: 12, opacity: 0.4 }}></i>
          <h3 style={{ color: "var(--text-primary)", marginBottom: 8, fontSize: 18 }}>
            Step {activeStep}: {FMS_STEPS.find((s) => s.id === activeStep)?.label}
          </h3>
          <p style={{ fontSize: 14, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
            This step will be fully functional once FMS column structure is provided.
            Currently showing {leads.length} total leads in FMS.
          </p>

          {/* Show basic lead table for now */}
          {leads.length > 0 && (
            <div style={{ marginTop: 24, textAlign: "left" }}>
              <LeadTable
                leads={leads}
                loading={isLoading}
                emptyMessage="No leads in FMS yet."
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ color: "var(--accent-red)", padding: 20, textAlign: "center", marginTop: 16 }}>
          <i className="bi bi-exclamation-triangle" style={{ marginRight: 8 }}></i>
          Failed to load FMS: {error.message}
        </div>
      )}
    </div>
  );
}