import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft, Sparkles, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle, Info, RefreshCw, MessageSquare
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import BottomNavigation from "../components/BottomNavigation";
import WeeklyChart from "../components/WeeklyChart";
import { api, auth } from "../api";

interface InsightsData {
  today_insights: string[];
  issues: { title: string; description: string }[];
  recommendations: { emoji: string; title: string; description: string }[];
  food_swaps: { avoid: string; better: string }[];
  weekly_summary: string;
  today_totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  goals: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  weekly_avg_calories: number;
  days_logged: number;
}

export default function NutritionInsightsScreen() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [weekly, setWeekly] = useState<{ day: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.isLoggedIn()) { navigate("/login"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:8000";
      const uid = auth.userId();

      const [insightsRes, weeklyData] = await Promise.all([
        fetch(`${BASE_URL}/insights`, {
          headers: { "x-user-id": uid!, "ngrok-skip-browser-warning": "true" },
        }).then((r) => r.json()),
        api.getWeekly(),
      ]);

      setInsights(insightsRes);
      setWeekly(weeklyData.map((d) => ({ day: d.day, value: d.value })));
    } catch (e) {
      setError("Could not load insights. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const macroData = insights
    ? [
        { name: "Protein", value: Math.round(insights.today_totals.protein), color: "#3B82F6" },
        { name: "Carbs",   value: Math.round(insights.today_totals.carbs),   color: "#F59E0B" },
        { name: "Fat",     value: Math.round(insights.today_totals.fat),     color: "#EF4444" },
      ].filter((d) => d.value > 0)
    : [];

  const progressPct = (val: number, goal: number) =>
    Math.min(Math.round((val / Math.max(goal, 1)) * 100), 100);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 px-6 py-4 sticky top-0 z-10 rounded-b-3xl">
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => navigate("/home")}
            className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft className="text-white" size={24} />
          </button>
          <h1 className="font-semibold text-lg text-white">AI Insights</h1>
          <button onClick={loadData}
            className="w-10 h-10 flex items-center justify-center">
            <RefreshCw className={`text-white ${loading ? "animate-spin" : ""}`} size={20} />
          </button>
        </div>
        <p className="text-white/70 text-sm text-center">Powered by Groq AI · Your real data</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Analyzing your nutrition data…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={loadData} className="mt-3 text-red-600 font-medium text-sm underline">
            Try Again
          </button>
        </div>
      )}

      {insights && !loading && (
        <>
          {/* Today's Progress */}
          <div className="px-6 mt-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Today's Progress</h3>
              <div className="space-y-3">
                {[
                  { label: "Calories", val: insights.today_totals.calories, goal: insights.goals.calories, unit: "kcal", color: "bg-orange-400" },
                  { label: "Protein",  val: insights.today_totals.protein,  goal: insights.goals.protein,  unit: "g",    color: "bg-blue-400" },
                  { label: "Carbs",    val: insights.today_totals.carbs,    goal: insights.goals.carbs,    unit: "g",    color: "bg-amber-400" },
                  { label: "Fat",      val: insights.today_totals.fat,      goal: insights.goals.fat,      unit: "g",    color: "bg-red-400" },
                  { label: "Fiber",    val: insights.today_totals.fiber,    goal: insights.goals.fiber,    unit: "g",    color: "bg-green-400" },
                ].map(({ label, val, goal, unit, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-medium text-gray-900">
                        {Math.round(val)}{unit} / {goal}{unit}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all`}
                        style={{ width: `${progressPct(val, goal)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly summary */}
          <div className="px-6 mt-4">
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
              <p className="text-purple-800 text-sm">
                📊 {insights.weekly_summary}
              </p>
              <p className="text-purple-600 text-xs mt-1">
                {insights.days_logged} days logged · avg {insights.weekly_avg_calories} kcal/day
              </p>
            </div>
          </div>

          {/* Today's AI Insights */}
          <div className="px-6 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Today's Insights</h3>
              <Sparkles size={18} className="text-purple-500" />
            </div>
            <div className="space-y-2">
              {insights.today_insights.map((msg, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-3">
                  <Info size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">{msg}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Issues */}
          {insights.issues.length > 0 && (
            <div className="px-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Detected Issues</h3>
              <div className="space-y-2">
                {insights.issues.map((issue, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border-l-4 border-red-400 shadow-sm">
                    <div className="flex gap-2 items-start">
                      <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{issue.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{issue.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Calorie Trend */}
          <div className="px-6 mt-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Weekly Calorie Trend</h3>
                <TrendingUp size={20} className="text-[#22C55E]" />
              </div>
              {weekly.length > 0
                ? <WeeklyChart data={weekly} />
                : <p className="text-gray-400 text-sm text-center py-4">No data yet</p>
              }
              <div className="mt-4 p-3 bg-green-50 rounded-xl">
                <p className="text-sm text-green-800">
                  📊 Averaging <span className="font-semibold">{insights.weekly_avg_calories} kcal/day</span>
                </p>
              </div>
            </div>
          </div>

          {/* Macro Distribution */}
          {macroData.length > 0 && (
            <div className="px-6 mt-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Today's Macro Split</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={macroData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                      paddingAngle={3} dataKey="value">
                      {macroData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 p-3 bg-orange-50 rounded-xl">
                  <p className="text-sm text-orange-800">💡 Ideal ratio: 30% protein, 40% carbs, 30% fat</p>
                </div>
              </div>
            </div>
          )}

          {/* Food Swaps */}
          {insights.food_swaps.length > 0 && (
            <div className="px-6 mt-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Better Food Choices</h3>
                <div className="space-y-2">
                  {insights.food_swaps.map((swap, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className="text-red-400 text-sm line-through flex-1">{swap.avoid}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-600 font-medium text-sm flex-1 text-right">{swap.better}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          <div className="px-6 mt-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-purple-500" />
                <h3 className="font-semibold text-gray-900">AI Recommendations</h3>
              </div>
              <div className="space-y-3">
                {insights.recommendations.map((rec, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${
                    i % 3 === 0 ? "bg-purple-50" : i % 3 === 1 ? "bg-blue-50" : "bg-green-50"
                  }`}>
                    <span className="text-2xl">{rec.emoji}</span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{rec.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ask AI button */}
          <div className="px-6 mt-6">
            <button onClick={() => navigate("/chat")}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-200">
              <MessageSquare size={20} />
              Ask AI About Your Diet
            </button>
          </div>
        </>
      )}

      <BottomNavigation />
    </div>
  );
}