import React, { useState, useEffect } from "react";
import {
  Link2,
  BarChart3,
  QrCode as QrIcon,
  Plus,
  History,
  Copy,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Globe,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://localhost:8080";

// Global Axios Config for better debugging
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.group("API Request Error");
    console.error("URL:", error.config?.url);
    console.error("Method:", error.config?.method);
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Full Error:", error);
    console.groupEnd();
    return Promise.reject(error);
  }
);

interface ClickData {
  timestamp: string;
  ip: string | null;
  ua: string | null;
}

interface URLStats {
  original_url: string;
  short_code: string;
  total_clicks: number;
  created_at: string;
  expires_at: string | null;
  last_clicks: ClickData[];
}

function App() {
  const [url, setUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [expiryDays, setExpiryDays] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [stats, setStats] = useState<URLStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [serverStatus, setServerStatus] = useState<
    "online" | "offline" | "checking"
  >("checking");

  useEffect(() => {
    const checkServer = async () => {
      try {
        await axios.get(`${API_BASE}/`); // Hello route
        setServerStatus("online");
      } catch (err) {
        setServerStatus("offline");
      }
    };
    checkServer();
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

      console.log("Sending request to:", `${API_BASE}/shorten`);
      const res = await axios.post(`${API_BASE}/shorten`, {
        url,
        custom_code: customCode || null,
        expires_at,
      });

      console.log("Success:", res.data);
      const fullUrl = `${API_BASE}/${res.data.short_code}`;
      setResult(fullUrl);
      fetchStats(res.data.short_code);
    } catch (err: any) {
      console.error("Shorten URL Error:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Connection to backend failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (code: string) => {
    try {
      const res = await axios.get(`${API_BASE}/stats/${code}`);
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats");
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
    <div className="min-h-screen">
      <div className="mesh-bg" />

      {/* Sidebar Navigation (Clean & Minimal) */}
      <nav className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-8 border-r border-white-[0.05] bg-black/20 backdrop-blur-xl hidden md:flex">
        <div className="p-3 bg-indigo-500/20 rounded-2xl mb-12">
          <Zap className="text-white" size={24} />
        </div>
        <div className="flex flex-col gap-8 text-neutral-500">
          <Link2 className="text-white cursor-pointer" size={22} />
          <BarChart3
            className="hover:text-white transition-colors cursor-pointer"
            size={22}
          />
          <History
            className="hover:text-white transition-colors cursor-pointer"
            size={22}
          />
        </div>
      </nav>

      {/* Main Content */}
      <main className="md:ml-20 p-6 md:p-12 lg:p-16 max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-16">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 gradient-text">
              Next-Gen Link Shortener
            </h1>
            <div className="flex items-center gap-3">
              <span className="badge">Internal API</span>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <div
                  className={`w-2 h-2 rounded-full ${
                    serverStatus === "online"
                      ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                      : serverStatus === "offline"
                      ? "bg-red-500"
                      : "bg-yellow-500 animate-pulse"
                  }`}
                />
                {serverStatus === "online"
                  ? "Server Connected"
                  : serverStatus === "offline"
                  ? "Server Disconnected"
                  : "Checking Connection..."}
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form Side */}
          <div className="lg:col-span-12 xl:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-8 md:p-10"
            >
              <h2 className="text-xl font-semibold mb-8 flex items-center gap-2">
                <Plus size={20} className="text-indigo-400" />
                Create Short Link
              </h2>

              <form onSubmit={shortenUrl} className="space-y-8">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">
                    Destination URL
                  </label>
                  <input
                    className="input-field text-lg"
                    placeholder="https://example.com/very-long-path"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">
                      Custom Alias (Optional)
                    </label>
                    <input
                      className="input-field"
                      placeholder="my-brand-link"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">
                      Expiration
                    </label>
                    <select
                      className="input-field appearance-none cursor-pointer"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(e.target.value)}
                    >
                      <option value="">Never Expires</option>
                      <option value="1">1 Day</option>
                      <option value="7">7 Days</option>
                      <option value="30">30 Days</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="action-btn w-full"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      Shorten Link <TrendingUp size={18} />
                    </>
                  )}
                </button>
              </form>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-8 overflow-hidden"
                  >
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
                      <AlertCircle size={18} className="mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Error Detected</p>
                        <p className="text-xs opacity-80">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Result Side */}
          <div className="lg:col-span-12 xl:col-span-5 relative">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="glass-panel p-8 border-indigo-500/30">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold flex items-center gap-2">
                        <CheckCircle2 className="text-indigo-400" size={20} />
                        Link Ready
                      </h3>
                      {stats && stats.expires_at && (
                        <span className="badge text-[10px]">
                          Expires{" "}
                          {new Date(stats.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        className="input-field bg-white/5 border-none font-medium"
                        readOnly
                        value={result}
                      />
                      <button
                        onClick={copyToClipboard}
                        className="p-3 glass-panel hover:bg-white/10 transition-colors"
                        title="Copy"
                      >
                        {copied ? (
                          <CheckCircle2
                            className="text-emerald-500"
                            size={20}
                          />
                        ) : (
                          <Copy size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="stat-card">
                      <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2">
                        Total Scans
                      </p>
                      <p className="text-3xl font-bold">
                        {stats?.total_clicks || 0}
                      </p>
                    </div>
                    <div className="stat-card flex flex-col items-center justify-center p-4">
                      <div className="bg-white p-2 rounded-xl">
                        <img
                          src={`${API_BASE}/qr/${
                            stats?.short_code || result.split("/").pop()
                          }`}
                          alt="QR Code"
                          className="w-20 h-20"
                        />
                      </div>
                      <p className="text-[10px] text-neutral-500 mt-2">
                        Scan for instant access
                      </p>
                    </div>
                  </div>

                  <div className="glass-panel p-6">
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                      <History size={16} className="text-neutral-500" />
                      Live Traffic
                    </h3>
                    <div className="space-y-3">
                      {stats?.last_clicks && stats.last_clicks.length > 0 ? (
                        stats.last_clicks.slice(0, 3).map((click, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center text-xs p-3 rounded-lg bg-white/5"
                          >
                            <span className="flex items-center gap-2">
                              <Globe size={12} className="text-neutral-500" />
                              {click.ip
                                ? click.ip.substring(0, 15) + "..."
                                : "Unknown"}
                            </span>
                            <span className="text-neutral-600">
                              {new Date(click.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-600 py-4 text-center">
                          Awaiting first scan...
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div
                  key="placeholder"
                  className="glass-panel p-12 h-full flex flex-col items-center justify-center text-center opacity-40 border-dashed"
                >
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <QrIcon size={32} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">
                    Analytics Workspace
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Shorten a URL to unlock live tracking and QR code
                    generation.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
