import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  User, Mail, Target, LogOut, ChevronRight, Flame, Moon, Sun, RefreshCw,
} from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";
import { useTheme } from "../components/ThemeProvider";
import { api, auth, type Goals } from "../api";

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(auth.name());
  const [email] = useState(auth.email());
  const [goals, setGoals] = useState<Goals>({ calories: 2000, protein: 150, carbs: 250, fat: 70, fiber: 30 });
  const [editingGoals, setEditingGoals] = useState(false);
  const [draftGoals, setDraftGoals] = useState<Goals>(goals);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth.isLoggedIn()) { navigate("/login"); return; }
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await api.getProfile();
      setName(profile.name || auth.name());
      setGoals(profile.goals);
      setDraftGoals(profile.goals);
    } catch (e) {
      console.error("Profile load error", e);
    }
  };

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  };

  const handleSaveGoals = async () => {
    setSaving(true);
    try {
      await api.updateGoals(draftGoals);
      setGoals(draftGoals);
      setEditingGoals(false);
    } catch (e) {
      alert("Could not save goals.");
    } finally {
      setSaving(false);
    }
  };

  const goalFields: { key: keyof Goals; label: string; unit: string; color: string }[] = [
    { key: "calories", label: "Daily Calories", unit: "kcal", color: "text-orange-500" },
    { key: "protein",  label: "Protein Goal",   unit: "g",    color: "text-blue-500" },
    { key: "carbs",    label: "Carbs Goal",      unit: "g",    color: "text-amber-500" },
    { key: "fat",      label: "Fat Goal",        unit: "g",    color: "text-red-500" },
    { key: "fiber",    label: "Fiber Goal",      unit: "g",    color: "text-green-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#22C55E] to-[#16a34a] px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center">
            <User size={40} className="text-white" />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold">{name || "You"}</h1>
            <p className="text-white/70 text-sm">{email}</p>
          </div>
        </div>
      </div>

      {/* Goals section */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={20} className="text-[#22C55E]" />
              <h2 className="font-semibold text-gray-900">Daily Goals</h2>
            </div>
            <button
              onClick={() => setEditingGoals(!editingGoals)}
              className="text-[#22C55E] text-sm font-medium"
            >
              {editingGoals ? "Cancel" : "Edit"}
            </button>
          </div>

          <div className="space-y-3">
            {goalFields.map(({ key, label, unit, color }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{label}</span>
                {editingGoals ? (
                  <input
                    type="number"
                    value={draftGoals[key]}
                    onChange={(e) =>
                      setDraftGoals((prev) => ({ ...prev, [key]: Number(e.target.value) }))
                    }
                    className="w-24 text-right border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30"
                  />
                ) : (
                  <span className={`font-semibold text-sm ${color}`}>
                    {goals[key]} {unit}
                  </span>
                )}
              </div>
            ))}
          </div>

          {editingGoals && (
            <button
              onClick={handleSaveGoals}
              disabled={saving}
              className="w-full mt-4 bg-[#22C55E] text-white py-3 rounded-2xl font-semibold disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Goals"}
            </button>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="px-6 mt-4">
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
          {/* Dark mode */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon size={20} className="text-gray-500" />
              ) : (
                <Sun size={20} className="text-gray-500" />
              )}
              <span className="text-gray-700 font-medium">
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

          {/* Reset onboarding */}
          <button
            onClick={() => {
              if (confirm("Reset onboarding?")) {
                localStorage.removeItem("onboardingCompleted");
                localStorage.removeItem("hasSeenWelcome");
                localStorage.removeItem("userProfile");
                navigate("/");
              }
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <RefreshCw size={20} className="text-gray-500" />
              <span className="text-gray-700 font-medium">Reset Onboarding</span>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} className="text-red-500" />
            <span className="text-red-500 font-medium">Log Out</span>
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}