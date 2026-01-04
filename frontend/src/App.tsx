import React, { useState, useEffect } from "react";
import {
  Link2,
  BarChart3,
  QrCode as QrIcon,
  Plus,
  Copy,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Globe,
  Zap,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://localhost:8080";

function App() {
  const [url, setUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [expiryDays, setExpiryDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [serverStatus, setServerStatus] = useState<
    "online" | "offline" | "waiting"
  >("waiting");

  useEffect(() => {
    const checkServer = async () => {
      try {
        await axios.get(`${API_BASE}/`);
        setServerStatus("online");
      } catch (err) {
        setServerStatus("offline");
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  const shortenUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let expires_at = null;
      if (expiryDays) {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(expiryDays));
        expires_at = date.toISOString();
      }

      const res = await axios.post(`${API_BASE}/shorten`, {
        url,
        custom_code: customCode || null,
        expires_at,
      });

      const fullUrl = `${API_BASE}/${res.data.short_code}`;
      setResult(fullUrl);
      fetchStats(res.data.short_code);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 500) {
        setError(
          "The server encountered an internal error. I've disabled rate-limiting, so please restart the backend to apply the fix."
        );
      } else {
        setError(
          err.response?.data?.error || err.message || "Connection failed."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (code: string) => {
    try {
      const res = await axios.get(`${API_BASE}/stats/${code}`);
      setStats(res.data);
    } catch (err) {
      console.error("Stats fetch failed");
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="app-bg" />

      <nav className="sidebar">
        <div className="nav-icon active">
          <Zap size={24} />
        </div>
        <div className="nav-icon">
          <Link2 size={24} />
        </div>
        <div className="nav-icon">
          <BarChart3 size={24} />
        </div>
        <div className="nav-icon" style={{ marginTop: "auto" }}>
          <Activity size={24} />
        </div>
      </nav>

      <main className="main-viewport">
        <div className="content-container fade-up">
          <header className="page-header">
            <div>
              <h1 className="title-glow">LinkNova Console</h1>
              <div className="server-label mt-4">
                <div
                  className={`status-dot ${
                    serverStatus === "online"
                      ? "online"
                      : serverStatus === "offline"
                      ? "offline"
                      : "waiting"
                  }`}
                />
                {serverStatus === "online"
                  ? "Core Engine Online"
                  : serverStatus === "offline"
                  ? "Core Engine Offline"
                  : "Syncing Engine Status..."}
              </div>
            </div>
            <div className="server-label">Stable v1.3.0</div>
          </header>

          <section className="grid-container">
            <div className="card-forge">
              <div className="ultra-card">
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    marginBottom: "40px",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <Plus style={{ color: "#10b981" }} size={28} />
                  Forge New Shortcut
                </h2>

                <form onSubmit={shortenUrl}>
                  <div className="field-group">
                    <label className="field-label">Destination Identity</label>
                    <input
                      className="modern-input"
                      placeholder="https://resource-location.com/path"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-split">
                    <div className="field-group">
                      <label className="field-label">Custom Designation</label>
                      <input
                        className="modern-input"
                        placeholder="e.g. custom-id"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value)}
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Link TTL</label>
                      <select
                        className="modern-input"
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(e.target.value)}
                        style={{ cursor: "pointer" }}
                      >
                        <option value="">Infinite Persistence</option>
                        <option value="1">24 Hour Window</option>
                        <option value="7">7 Day Cycle</option>
                        <option value="30">30 Day Epoch</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-wowie"
                    disabled={loading}
                  >
                    {loading ? (
                      "Initializing..."
                    ) : (
                      <>
                        Generate Fragment <TrendingUp size={20} />
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="error-vibe"
                      >
                        <AlertCircle size={24} style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: "13px" }}>
                          <strong
                            style={{ display: "block", marginBottom: "4px" }}
                          >
                            System Exception
                          </strong>
                          <p>{error}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            </div>

            <div className="card-metrics">
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                  >
                    <div className="ultra-card">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "32px",
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "1.1rem",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <CheckCircle2
                            style={{ color: "#10b981" }}
                            size={20}
                          />
                          Network Fragment Ready
                        </h3>
                      </div>

                      <div
                        className="modern-input"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "rgba(255,255,255,0.02)",
                          padding: "24px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                            color: "#818cf8",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {result}
                        </span>
                        <button
                          onClick={copyToClipboard}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: copied ? "#10b981" : "#64748b",
                            cursor: "pointer",
                            display: "flex",
                          }}
                        >
                          {copied ? (
                            <CheckCircle2 size={24} />
                          ) : (
                            <Copy size={24} />
                          )}
                        </button>
                      </div>

                      <div className="mini-stats">
                        <div className="stat-box">
                          <span className="field-label">Engagements</span>
                          <div style={{ fontSize: "2.5rem", fontWeight: 800 }}>
                            {stats?.total_clicks || 0}
                          </div>
                        </div>
                        <div
                          className="stat-box"
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <div className="qr-plate">
                            <img
                              src={`${API_BASE}/qr/${
                                stats?.short_code || result.split("/").pop()
                              }`}
                              alt="QR"
                              style={{
                                width: "80px",
                                height: "80px",
                                display: "block",
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: "40px" }}>
                        <span className="field-label">Traffic Log</span>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            marginTop: "16px",
                          }}
                        >
                          {stats?.last_clicks?.length > 0 ? (
                            stats.last_clicks
                              .slice(0, 3)
                              .map((c: any, i: number) => (
                                <div
                                  key={i}
                                  style={{
                                    padding: "16px",
                                    borderRadius: "18px",
                                    background: "rgba(255,255,255,0.02)",
                                    fontSize: "11px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    color: "#64748b",
                                    border: "1px solid var(--border-dim)",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    <Globe size={12} />
                                    {c.ip || "Anonymous Client"}
                                  </span>
                                  <span style={{ opacity: 0.6 }}>
                                    {new Date(c.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                              ))
                          ) : (
                            <div
                              style={{
                                padding: "32px",
                                textAlign: "center",
                                color: "#334155",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              Syncing incoming traffic metrics...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div
                    className="ultra-card"
                    style={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      borderStyle: "dashed",
                      opacity: 0.8,
                    }}
                  >
                    <div
                      style={{
                        padding: "32px",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: "50%",
                        marginBottom: "32px",
                      }}
                    >
                      <QrIcon size={56} style={{ opacity: 0.3 }} />
                    </div>
                    <h3
                      style={{
                        fontSize: "1.25rem",
                        fontWeight: 800,
                        marginBottom: "24px",
                      }}
                    >
                      Metrics Console
                    </h3>

                    <div style={{ width: "100%", maxWidth: "280px" }}>
                      <label
                        className="field-label"
                        style={{ textAlign: "left" }}
                      >
                        Lookup Existing Code
                      </label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          className="modern-input"
                          placeholder="e.g. drop-it"
                          style={{ padding: "12px 16px", fontSize: "13px" }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const code = (e.target as HTMLInputElement).value;
                              if (code) {
                                setResult(`${API_BASE}/${code}`);
                                fetchStats(code);
                              }
                            }
                          }}
                        />
                        <button
                          className="btn-wowie"
                          style={{
                            width: "50px",
                            height: "auto",
                            padding: "0",
                            borderRadius: "16px",
                          }}
                          onClick={(e) => {
                            const input = e.currentTarget
                              .previousSibling as HTMLInputElement;
                            if (input.value) {
                              setResult(`${API_BASE}/${input.value}`);
                              fetchStats(input.value);
                            }
                          }}
                        >
                          <Activity size={18} />
                        </button>
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        marginTop: "32px",
                        maxWidth: "240px",
                      }}
                    >
                      Deploy a new fragment or enter a code above to initialize
                      real-time tracking.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
