import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle, XCircle, Clock, LogOut, RefreshCw,
  Image as ImageIcon, ChevronRight, Shield
} from "lucide-react";
import { auth } from "../api";

interface Candidate {
  scan_id: string;
  label: string;
  image_name: string;
}

interface Stats {
  pending: number;
  approved_today: number;
  declined_today: number;
}

export default function ModeratorScreen() {
  const navigate = useNavigate();
  const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:8000";

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved_today: 0, declined_today: 0 });
  const [selectedImg, setSelectedImg] = useState<Candidate | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (role !== "moderator") {
      navigate("/home");
      return;
    }
    loadCandidates();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/new-candidates`, {
        headers: {
          "x-user-id": auth.userId() ?? "",
          "ngrok-skip-browser-warning": "true",
        },
      });
      const data = await res.json();
      setCandidates(data);
      setStats({ pending: data.length, approved_today: 0, declined_today: 0 });
    } catch {
      showToast("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (scan_id: string, action: "approve" | "decline") => {
    setActionLoading(scan_id);
    try {
      await fetch(`${BASE_URL}/admin/${action}/${scan_id}`, {
        method: "POST",
        headers: {
          "x-user-id": auth.userId() ?? "",
          "ngrok-skip-browser-warning": "true",
        },
      });
      setCandidates((prev) => prev.filter((c) => c.scan_id !== scan_id));
      setSelectedImg(null);
      setStats((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        approved_today: action === "approve" ? prev.approved_today + 1 : prev.approved_today,
        declined_today: action === "decline" ? prev.declined_today + 1 : prev.declined_today,
      }));
      showToast(action === "approve" ? "✅ Approved & added to training data!" : "❌ Declined");
    } catch {
      showToast("Action failed. Try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    auth.logout();
    localStorage.removeItem("user_role");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      {selectedImg && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center px-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="relative">
              <img
                src={`/uploads/${selectedImg.image_name}`}
                alt={selectedImg.label}
                className="w-full h-72 object-cover bg-gray-200"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (!img.src.includes("data:image")) {
                    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='18'%3EImage Not Found%3C/text%3E%3C/svg%3E";
                  }
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white font-bold text-lg capitalize">
                  {selectedImg.label.replace(/_/g, " ")}
                </p>
                <p className="text-white/70 text-sm">User submitted label</p>
              </div>
            </div>

            <div className="p-5">
              <p className="text-gray-500 text-sm mb-4 text-center">
                Does this image match the label <span className="font-semibold text-gray-900 capitalize">"{selectedImg.label.replace(/_/g, " ")}"</span>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction(selectedImg.scan_id, "decline")}
                  disabled={actionLoading === selectedImg.scan_id}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-red-200 bg-red-50 text-red-600 font-semibold disabled:opacity-50">
                  <XCircle size={20} />
                  Decline
                </button>
                <button
                  onClick={() => handleAction(selectedImg.scan_id, "approve")}
                  disabled={actionLoading === selectedImg.scan_id}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#22C55E] text-white font-semibold shadow-lg shadow-[#22C55E]/30 disabled:opacity-50">
                  <CheckCircle size={20} />
                  Approve
                </button>
              </div>
              <button onClick={() => setSelectedImg(null)}
                className="w-full mt-3 text-gray-400 py-2 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 px-6 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="text-white" size={22} />
            <h1 className="text-white font-bold text-xl">Moderator</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadCandidates}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <RefreshCw className={`text-white ${loading ? "animate-spin" : ""}`} size={16} />
            </button>
            <button onClick={handleLogout}
              className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <LogOut className="text-white" size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Pending", value: stats.pending, color: "bg-amber-400" },
            { label: "Approved", value: stats.approved_today, color: "bg-green-400" },
            { label: "Declined", value: stats.declined_today, color: "bg-red-400" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/20 rounded-2xl p-3 text-center">
              <p className="text-white font-bold text-2xl">{value}</p>
              <p className="text-white/70 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading submissions…</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <CheckCircle size={48} className="text-green-400" />
            <p className="text-gray-700 font-semibold text-lg">All caught up!</p>
            <p className="text-gray-400 text-sm">No pending submissions</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                Pending Review ({candidates.length})
              </h2>
              <div className="flex items-center gap-1 text-amber-500">
                <Clock size={14} />
                <span className="text-xs font-medium">Awaiting review</span>
              </div>
            </div>

            <div className="space-y-3">
              {candidates.map((candidate) => (
                <button
                  key={candidate.scan_id}
                  onClick={() => setSelectedImg(candidate)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:border-indigo-200 transition-all">
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <img
                      src={`/uploads/${candidate.image_name}`}
                      alt={candidate.label}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={20} className="text-gray-300" />
                    </div>
                  </div>

                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 capitalize">
                      {candidate.label.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {candidate.scan_id.slice(0, 8)}…
                    </p>
                    <div className="flex gap-2 mt-1.5">
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        Pending
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>

            <div className="mt-6 mb-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
              <p className="text-sm text-blue-800 font-medium mb-1">💡 Tip</p>
              <p className="text-xs text-blue-600">
                Tap any item to view the full image and approve or decline. Approved images are automatically added to the training dataset for model improvement.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}