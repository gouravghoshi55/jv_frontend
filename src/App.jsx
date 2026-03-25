import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "./api.js";
import LoginPage from "./pages/LoginPage.jsx";
import PipelinePage from "./pages/PipelinePage.jsx";
import NotQualifiedPage from "./pages/NotQualifiedPage.jsx";
import ColdLeadsPage from "./pages/ColdLeadsPage.jsx";
import FMSPage from "./pages/FMSPage.jsx";
import DonePage from "./pages/DonePage.jsx";

const ALL_TABS = [
  { id: "pipeline", label: "Pipeline", icon: "bi-funnel", sheetName: "PIPELINE" },
  { id: "not-qualified", label: "Not Qualified", icon: "bi-x-circle", sheetName: "NOT QUALIFIED LEADS" },
  { id: "cold-leads", label: "Cold Leads", icon: "bi-snow2", sheetName: "COLD LEADS" },
  { id: "fms", label: "FMS", icon: "bi-diagram-3", sheetName: "FMS" },
  { id: "done", label: "Done", icon: "bi-check-circle", sheetName: "DONE" },
];

function getVisibleTabs(user) {
  if (!user) return [];
  const workingTabs = (user.workingTabs || "All").trim();

  if (workingTabs.toLowerCase() === "all") {
    return ALL_TABS;
  }

  const allowedNames = workingTabs.split(",").map((t) => t.trim().toUpperCase());

  return ALL_TABS.filter((tab) => {
    const sheetUpper = tab.sheetName.toUpperCase();
    const labelUpper = tab.label.toUpperCase();
    return allowedNames.some(
      (name) =>
        sheetUpper.includes(name) ||
        labelUpper.includes(name) ||
        name.includes(sheetUpper) ||
        name.includes(labelUpper)
    );
  });
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const saved = localStorage.getItem("jv_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        api.post("/auth/verify", { userId: parsed.userId })
          .then((res) => {
            setUser(res.data.user);
            localStorage.setItem("jv_user", JSON.stringify(res.data.user));
          })
          .catch(() => {
            localStorage.removeItem("jv_user");
          })
          .finally(() => setAuthChecked(true));
      } catch {
        localStorage.removeItem("jv_user");
        setAuthChecked(true);
      }
    } else {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const tabs = getVisibleTabs(user);
      if (tabs.length > 0 && !activeTab) {
        setActiveTab(tabs[0].id);
      }
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("jv_user");
    setUser(null);
    setActiveTab("");
    queryClient.clear();
    toast.info("Logged out successfully");
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post("/sync");
      toast.success(res.data.message);
      queryClient.invalidateQueries();
    } catch (err) {
      toast.error("Sync failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSyncing(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="login-container">
        <div className="loading">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const visibleTabs = getVisibleTabs(user);

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
        return visibleTabs.length > 0 ? (
          <div className="empty-state">
            <i className="bi bi-hand-index"></i>
            <p>Select a tab to get started</p>
          </div>
        ) : (
          <div className="empty-state">
            <i className="bi bi-lock"></i>
            <p>No tabs assigned. Contact Admin.</p>
          </div>
        );
    }
  };

  return (
    <div className="app-layout">
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

          <div className="user-info">
            <div className="user-avatar">
              {user.userName.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user.userName}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </header>

      <nav className="top-tabs">
        {visibleTabs.map((tab) => (
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

      <main className="page-content">{renderPage()}</main>
    </div>
  );
}