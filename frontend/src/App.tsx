import React, { useState, useEffect } from "react";
import {
  Link2,
  ExternalLink,
  BarChart3,
  QrCode,
  Clock,
  Globe,
  Plus,
  History,
  Copy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = "http://localhost:8080";

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

      setResult(`${API_BASE}/${res.data.short_code}`);
      fetchStats(res.data.short_code);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to shorten URL");
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
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500 rounded-xl">
            <Link2 className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Short<span className="premium-gradient-text">Nova</span>
          </h1>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-white transition-colors">
            Dashboard
          </a>
          <a href="#" className="hover:text-white transition-colors">
            API Keys
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Documentation
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Shortener */}
        <div className="lg:col-span-12 xl:col-span-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 mb-8"
          >
            <h2 className="text-3xl font-bold mb-2">
              Shorten your long URLs{" "}
              <span className="premium-gradient-text">instantly</span>
            </h2>
            <p className="text-slate-400 mb-8">
              Custom codes, analytics, and QR codes included.
            </p>

            <form onSubmit={shortenUrl} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Original URL
                  </label>
                  <input
                    className="premium-input"
                    placeholder="https://very-long-link.com/something..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="w-full md:w-48">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Custom Code (Optional)
                  </label>
                  <input
                    className="premium-input"
                    placeholder="e.g. my-link"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-32">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Expires In
                  </label>
                  <select
                    className="premium-input"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                  >
                    <option value="">Never</option>
                    <option value="1">1 Day</option>
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="premium-btn w-full justify-center text-lg"
              >
                {loading ? (
                  "Shortening..."
                ) : (
                  <>
                    <Plus size={20} /> Shorten URL
                  </>
                )}
              </button>
            </form>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-3"
              >
                <AlertCircle size={20} />
                {error}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Results & Stats */}
        <AnimatePresence>
          {result && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="lg:col-span-5 space-y-8"
              >
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-500" />
                    Success!
                  </h3>
                  <div className="flex gap-2">
                    <input
                      className="premium-input bg-slate-800/50"
                      readOnly
                      value={result}
                    />
                    <button
                      onClick={copyToClipboard}
                      className="p-3 glass-card hover:bg-slate-700 transition-colors"
                      title="Copy"
                    >
                      {copied ? (
                        <CheckCircle2 className="text-emerald-500" size={20} />
                      ) : (
                        <Copy size={20} />
                      )}
                    </button>
                    <a
                      href={result}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 glass-card hover:bg-slate-700 transition-colors"
                    >
                      <ExternalLink size={20} />
                    </a>
                  </div>
                </div>

                <div className="glass-card p-6 flex flex-col items-center">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2 w-full">
                    <QrCode className="text-indigo-400" />
                    QR Code
                  </h3>
                  <div className="bg-white p-4 rounded-2xl w-fit">
                    <img
                      src={`${API_BASE}/qr/${
                        stats?.short_code || result.split("/").pop()
                      }`}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-sm text-slate-400 mt-4 text-center">
                    Scan to open the shortened URL
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-7"
              >
                {stats ? (
                  <div className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-card p-6">
                        <BarChart3 className="text-indigo-400 mb-2" />
                        <div className="text-2xl font-bold">
                          {stats.total_clicks}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">
                          Total Clicks
                        </div>
                      </div>
                      <div className="glass-card p-6">
                        <Clock className="text-emerald-400 mb-2" />
                        <div className="text-sm font-semibold truncate">
                          {stats.expires_at
                            ? new Date(stats.expires_at).toLocaleDateString()
                            : "Never"}
                        </div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider">
                          Expiration
                        </div>
                      </div>
                    </div>

                    {/* Reach History */}
                    <div className="glass-card p-6">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <History className="text-indigo-400" />
                        Recent Activity
                      </h3>
                      <div className="space-y-4">
                        {stats.last_clicks.length > 0 ? (
                          stats.last_clicks.map((click, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
                            >
                              <div className="flex items-center gap-3">
                                <Globe size={16} className="text-slate-500" />
                                <span className="text-sm font-medium">
                                  {click.ip || "Unknown IP"}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">
                                {new Date(click.timestamp).toLocaleString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-slate-500">
                            No clicks yet. Share your link!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-12 flex items-center justify-center text-slate-500">
                    Loading detailed analytics...
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-6xl mx-auto mt-20 pb-8 text-center text-slate-500 text-sm">
        &copy; 2026 ShortNova. Built with Rust and React.
      </footer>
    </div>
  );
}

export default App;
