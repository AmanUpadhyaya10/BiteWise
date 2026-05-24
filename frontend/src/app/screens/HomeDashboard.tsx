import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Camera, Upload, Flame, Beef, Wheat, Droplet,
  TrendingUp, Award, Sparkles, Bone, Activity, Calendar, BarChart3,
} from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";
import ProgressRing from "../components/ProgressRing";
import NutritionCard from "../components/NutritionCard";
import WeeklyChart from "../components/WeeklyChart";
import StreakCounter from "../components/StreakCounter";
import { api, auth, type TodayResponse, type WeeklyDay } from "../api";

export default function HomeDashboard() {
  const navigate = useNavigate();
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [weekly, setWeekly] = useState<WeeklyDay[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      navigate("/login");
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [todayData, weeklyData, streakData] = await Promise.all([
        api.getToday(),
        api.getWeekly(),
        api.getStreak(),
      ]);
      setToday(todayData);
      setWeekly(weeklyData);
      setStreak(streakData.streak);
    } catch (e) {
      console.error("Dashboard load error", e);
    } finally {
      setLoading(false);
    }
  };

  const caloriesConsumed = today?.totals.calories ?? 0;
  const caloriesGoal    = today?.goals.calories    ?? 2000;
  const caloriesRemaining = Math.max(caloriesGoal - caloriesConsumed, 0);
  const progressPercentage = Math.min((caloriesConsumed / caloriesGoal) * 100, 100);

  const proteinValue = today?.totals.protein ?? 0;
  const proteinMax   = today?.goals.protein  ?? 150;
  const carbsValue   = today?.totals.carbs   ?? 0;
  const carbsMax     = today?.goals.carbs    ?? 250;
  const fatValue     = today?.totals.fat     ?? 0;
  const fatMax       = today?.goals.fat      ?? 70;
  const fiberValue   = today?.totals.fiber   ?? 0;
  const fiberMax     = today?.goals.fiber    ?? 30;

  const weeklyChartData = weekly.map((d) => ({ day: d.day, value: d.value }));

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#22C55E] to-[#16a34a] px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/80 text-sm">Good Morning</p>
            <h1 className="text-white text-2xl font-bold">{auth.name() || "There"}</h1>
          </div>
          <button
            onClick={() => navigate("/insights")}
            className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
          >
            <Sparkles className="text-white" size={20} />
          </button>
        </div>

        {/* Streak */}
        <div className="mb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3">
            <Flame size={28} className="text-orange-400" />
            <div>
              <p className="text-white/80 text-sm">Current Streak</p>
              <p className="text-white text-2xl font-bold">{streak} Day{streak !== 1 ? "s" : ""} 🔥</p>
            </div>
          </div>
        </div>

        {/* Calories Ring */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">Calories Today</p>
              <p className="text-white text-4xl font-bold">{Math.round(caloriesConsumed)}</p>
              <p className="text-white/70 text-sm mt-1">of {caloriesGoal} kcal goal</p>
              <p className="text-white/60 text-xs mt-2">
                {Math.round(caloriesRemaining)} kcal remaining
              </p>
            </div>
            <ProgressRing percentage={progressPercentage} size={100} strokeWidth={10} color="white" />
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-400 text-sm">Loading your data…</div>
      )}

      {/* Macro Cards */}
      <div className="px-6 mt-6 grid grid-cols-2 gap-3">
        <NutritionCard icon={<Beef size={20} className="text-blue-500" />} label="Protein"
          value={Math.round(proteinValue)} max={proteinMax} unit="g" color="#3B82F6" />
        <NutritionCard icon={<Wheat size={20} className="text-amber-500" />} label="Carbs"
          value={Math.round(carbsValue)} max={carbsMax} unit="g" color="#F59E0B" />
        <NutritionCard icon={<Droplet size={20} className="text-red-500" />} label="Fat"
          value={Math.round(fatValue)} max={fatMax} unit="g" color="#EF4444" />
        <NutritionCard icon={<Bone size={20} className="text-green-500" />} label="Fiber"
          value={Math.round(fiberValue)} max={fiberMax} unit="g" color="#22C55E" />
      </div>

      {/* Weekly Chart */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Weekly Calories</h3>
            <button onClick={() => navigate("/weekly-report")}
              className="flex items-center gap-1 text-[#22C55E] text-sm font-medium">
              <BarChart3 size={16} />Report
            </button>
          </div>
          {weeklyChartData.length > 0
            ? <WeeklyChart data={weeklyChartData} />
            : <p className="text-gray-400 text-sm text-center py-4">No data yet — start logging meals!</p>
          }
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/scan")}
            className="bg-[#22C55E] rounded-3xl p-5 flex flex-col items-center gap-2 shadow-lg shadow-[#22C55E]/20 text-white"
          >
            <Camera size={28} />
            <span className="font-semibold text-sm">Scan Food</span>
          </button>
          <button
            onClick={() => navigate("/history")}
            className="bg-white rounded-3xl p-5 flex flex-col items-center gap-2 border border-gray-200 shadow-sm text-gray-700"
          >
            <Calendar size={28} />
            <span className="font-semibold text-sm">Meal History</span>
          </button>
          <button
            onClick={() => navigate("/insights")}
            className="bg-white rounded-3xl p-5 flex flex-col items-center gap-2 border border-gray-200 shadow-sm text-gray-700"
          >
            <TrendingUp size={28} />
            <span className="font-semibold text-sm">Insights</span>
          </button>
          <button
            onClick={() => navigate("/achievements")}
            className="bg-white rounded-3xl p-5 flex flex-col items-center gap-2 border border-gray-200 shadow-sm text-gray-700"
          >
            <Award size={28} />
            <span className="font-semibold text-sm">Achievements</span>
          </button>
        </div>
      </div>

      {/* Today's Meals preview */}
      {today && today.meals.length > 0 && (
        <div className="px-6 mt-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Today's Meals</h3>
            <button onClick={() => navigate("/history")}
              className="text-[#22C55E] text-sm font-medium">View All</button>
          </div>
          <div className="space-y-2">
            {today.meals.slice(0, 3).map((m) => (
              <div key={m.id}
                className="bg-white rounded-2xl p-4 flex items-center justify-between border border-gray-100">
                <div>
                  <p className="font-medium text-gray-900 capitalize">{m.food_name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {m.meal_type} · {m.quantity_g}g
                  </p>
                </div>
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame size={14} />
                  <span className="text-sm font-semibold">{Math.round(m.calories)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}