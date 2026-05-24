import { useState, useEffect } from "react";
import { Calendar, Trash2, Flame } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";
import { api, type MealEntry } from "../api";

export default function MealHistoryScreen() {
  const [activeFilter, setActiveFilter] = useState("today");
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const filterDays: Record<string, number> = {
    today: 1,
    thisweek: 7,
    thismonth: 30,
  };

  useEffect(() => {
    loadHistory();
  }, [activeFilter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory(filterDays[activeFilter] ?? 7);
      setMeals(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this meal?")) return;
    try {
      await api.deleteMeal(id);
      setMeals((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      alert("Could not delete meal.");
    }
  };

  // Group by date
  const grouped = meals.reduce<Record<string, MealEntry[]>>((acc, m) => {
    const d = new Date(m.logged_at);
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);

    let label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    if (d.toDateString() === today.toDateString()) label = "Today";
    if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";

    if (!acc[label]) acc[label] = [];
    acc[label].push(m);
    return acc;
  }, {});

  const filters = [
    { key: "today", label: "Today" },
    { key: "thisweek", label: "This Week" },
    { key: "thismonth", label: "This Month" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Meal History</h1>
          <Calendar size={24} className="text-gray-400" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === f.key
                  ? "bg-[#22C55E] text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      )}

      {!loading && meals.length === 0 && (
        <div className="text-center py-16 px-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No meals logged yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Scan food and log meals to see them here.
          </p>
        </div>
      )}

      {/* Grouped meal list */}
      <div className="px-6 mt-4 space-y-6">
        {Object.entries(grouped).map(([dateLabel, dayMeals]) => (
          <div key={dateLabel}>
            <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
              {dateLabel}
            </h2>
            <div className="space-y-3">
              {dayMeals.map((meal) => (
                <div key={meal.id}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
                  {meal.image_url ? (
                    <img
                      src={`http://localhost:8000${meal.image_url}`}
                      alt={meal.food_name}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Flame size={24} className="text-[#22C55E]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 capitalize truncate">{meal.food_name}</p>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">
                      {meal.meal_type} · {meal.quantity_g}g ·{" "}
                      {new Date(meal.logged_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs text-gray-400">
                      <span>P {Math.round(meal.protein)}g</span>
                      <span>C {Math.round(meal.carbs)}g</span>
                      <span>F {Math.round(meal.fat)}g</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame size={14} />
                      <span className="text-sm font-semibold">{Math.round(meal.calories)}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(meal.id)}
                      className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <BottomNavigation />
    </div>
  );
}