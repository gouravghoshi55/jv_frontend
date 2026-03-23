import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "./api.js";
import PipelinePage from "./pages/PipelinePage.jsx";
import NotQualifiedPage from "./pages/NotQualifiedPage.jsx";
import ColdLeadsPage from "./pages/ColdLeadsPage.jsx";
import FMSPage from "./pages/FMSPage.jsx";
import DonePage from "./pages/DonePage.jsx";

const TABS = [
  { id: "pipeline", label: "Pipeline", icon: "bi-funnel" },
  { id: "not-qualified", label: "Not Qualified", icon: "bi-x-circle" },
  { id: "cold-leads", label: "Cold Leads", icon: "bi-snow2" },
  { id: "fms", label: "FMS", icon: "bi-diagram-3" },
  { id: "done", label: "Done", icon: "bi-check-circle" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post("/sync");
      toast.success(res.data.message);
    } catch (err) {
      toast.error("Sync failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const renderPage = () => {
    switch (activeTab) {
      case "pipeline":
        return <PipelinePage />;
      case "not-qualified":
        return <NotQualifiedPage />;
      case "cold-leads":
        return <ColdLeadsPage />;
      case "fms":
        return <FMSPage />;
      case "done":
        return <DonePage />;
      default:
        return <PipelinePage />;
    }
  };

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <h1>
          <i className="bi bi-buildings"></i>
          <span>JV</span> Lead Management
        </h1>
        <div className="header-actions">
          <button
            className="btn btn-sync"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span>
                Syncing...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-repeat"></i>
                Sync Leads
              </>
            )}
          </button>
        </div>
      </header>

      {/* Top Tabs */}
      <nav className="top-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`top-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`bi ${tab.icon}`} style={{ marginRight: 6 }}></i>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Page Content */}
      <main className="page-content">{renderPage()}</main>
    </div>
  );
}