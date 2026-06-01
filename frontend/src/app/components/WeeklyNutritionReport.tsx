import { TrendingUp, TrendingDown, AlertCircle, Sparkles, ArrowRight } from "lucide-react";

interface NutrientStatus {
  value: number;
  goal: number;
  status: "low" | "balanced" | "high";
  trend: "up" | "down" | "stable";
}

interface WeeklySummary {
  calories: NutrientStatus;
  protein: NutrientStatus;
  carbs: NutrientStatus;
  fat: NutrientStatus;
  fiber: NutrientStatus;
}

interface Problem {
  id: string;
  title: string;
  description: string;
  severity: "warning" | "info";
  icon: string;
}

interface Suggestion {
  id: string;
  text: string;
}

interface FoodReplacement {
  id: string;
  bad: string;
  good: string;
}

export default function WeeklyNutritionReport() {
  const weeklySummary: WeeklySummary = {
    calories: { value: 1850, goal: 2000, status: "balanced", trend: "stable" },
    protein: { value: 55, goal: 75, status: "low", trend: "down" },
    carbs: { value: 220, goal: 200, status: "high", trend: "up" },
    fat: { value: 60, goal: 65, status: "balanced", trend: "stable" },
    fiber: { value: 12, goal: 25, status: "low", trend: "down" },
  };

  const problems: Problem[] = [
    {
      id: "1",
      title: "Low Protein Throughout the Week",
      description: "You consistently consumed less protein in the last 7 days.",
      severity: "warning",
      icon: "⚠️",
    },
    {
      id: "2",
      title: "High Carb Intake",
      description: "Your carb intake exceeded recommended levels on 5 days.",
      severity: "warning",
      icon: "⚠️",
    },
    {
      id: "3",
      title: "Low Fiber Intake",
      description: "You are missing fiber-rich foods in most meals.",
      severity: "warning",
      icon: "⚠️",
    },
  ];

  const suggestions: Suggestion[] = [
    {
      id: "1",
      text: "Add eggs, paneer, or dal in breakfast for better protein intake",
    },
    {
      id: "2",
      text: "Replace white rice with brown rice or quinoa",
    },
    {
      id: "3",
      text: "Include fruits like apple and banana for fiber",
    },
    {
      id: "4",
      text: "Add green vegetables like spinach for iron",
    },
  ];

  const foodReplacements: FoodReplacement[] = [
    { id: "1", bad: "White Rice", good: "Brown Rice" },
    { id: "2", bad: "Fried Snacks", good: "Roasted Snacks" },
    { id: "3", bad: "Sugary Drinks", good: "Coconut Water" },
    { id: "4", bad: "White Bread", good: "Whole Wheat Bread" },
  ];

  const weeklyData = [
    { day: "Mon", calories: 1800, highlight: false },
    { day: "Tue", calories: 2100, highlight: false },
    { day: "Wed", calories: 1600, highlight: true },
    { day: "Thu", calories: 2200, highlight: false },
    { day: "Fri", calories: 2000, highlight: false },
    { day: "Sat", calories: 1700, highlight: true },
    { day: "Sun", calories: 1450, highlight: true },
  ];

  const getStatusColor = (status: "low" | "balanced" | "high") => {
    switch (status) {
      case "low":
        return "text-red-500";
      case "balanced":
        return "text-[#22C55E]";
      case "high":
        return "text-yellow-500";
    }
  };

  const getStatusBg = (status: "low" | "balanced" | "high") => {
    switch (status) {
      case "low":
        return "bg-red-50 border-red-200";
      case "balanced":
        return "bg-green-50 border-green-200";
      case "high":
        return "bg-yellow-50 border-yellow-200";
    }
  };

  const getStatusLabel = (status: "low" | "balanced" | "high") => {
    switch (status) {
      case "low":
        return "Low";
      case "balanced":
        return "Balanced";
      case "high":
        return "High";
    }
  };

  const maxCalories = Math.max(...weeklyData.map((d) => d.calories));

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Weekly Nutrition Report 📊
        </h2>
        <p className="text-sm text-gray-600">Based on your last 7 days of meals</p>
      </div>

      {/* Weekly Summary Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">Weekly Overview</h3>
        <div className="space-y-4">
          {/* Calories */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Avg Calories
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBg(weeklySummary.calories.status)}`}
                >
                  {getStatusLabel(weeklySummary.calories.status)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {weeklySummary.calories.value}
                </span>
                <span className="text-sm text-gray-500">
                  / {weeklySummary.calories.goal} kcal
                </span>
                {weeklySummary.calories.trend === "up" && (
                  <TrendingUp size={16} className="text-[#22C55E]" />
                )}
                {weeklySummary.calories.trend === "down" && (
                  <TrendingDown size={16} className="text-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Protein */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Avg Protein
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBg(weeklySummary.protein.status)}`}
                >
                  {getStatusLabel(weeklySummary.protein.status)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {weeklySummary.protein.value}g
                </span>
                {weeklySummary.protein.trend === "down" && (
                  <TrendingDown size={16} className="text-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Carbs */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Avg Carbs
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBg(weeklySummary.carbs.status)}`}
                >
                  {getStatusLabel(weeklySummary.carbs.status)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {weeklySummary.carbs.value}g
                </span>
                {weeklySummary.carbs.trend === "up" && (
                  <TrendingUp size={16} className="text-yellow-500" />
                )}
              </div>
            </div>
          </div>

          {/* Fat */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">Avg Fat</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBg(weeklySummary.fat.status)}`}
                >
                  {getStatusLabel(weeklySummary.fat.status)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {weeklySummary.fat.value}g
                </span>
              </div>
            </div>
          </div>

          {/* Fiber */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Avg Fiber
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBg(weeklySummary.fiber.status)}`}
                >
                  {getStatusLabel(weeklySummary.fiber.status)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {weeklySummary.fiber.value}g
                </span>
                {weeklySummary.fiber.trend === "down" && (
                  <TrendingDown size={16} className="text-red-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Pattern Visualization */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">Weekly Pattern</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {weeklyData.map((item) => (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center flex-1">
                <div
                  className={`w-full rounded-t-lg transition-all ${
                    item.highlight
                      ? "bg-red-400"
                      : "bg-gradient-to-t from-[#22C55E] to-[#16a34a]"
                  }`}
                  style={{
                    height: `${(item.calories / maxCalories) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">
                {item.day}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#22C55E]" />
            <span className="text-xs text-gray-600">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-400" />
            <span className="text-xs text-gray-600">Weak Days</span>
          </div>
        </div>
      </div>

      {/* Problem Detection */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900">Detected Issues</h3>
        {problems.map((problem) => (
          <div
            key={problem.id}
            className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-red-400"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{problem.icon}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {problem.title}
                </h4>
                <p className="text-sm text-gray-600">{problem.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Smart Weekly Suggestions */}
      <div className="bg-gradient-to-br from-[#22C55E]/10 to-[#16a34a]/10 rounded-2xl p-6 border border-[#22C55E]/20">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-[#22C55E]" size={24} />
          <h3 className="font-bold text-gray-900">How to Improve Your Diet</h3>
        </div>
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="flex items-start gap-3">
              <ArrowRight className="text-[#22C55E] flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-gray-700">{suggestion.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Food Replacement Suggestions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">Better Food Choices 🔄</h3>
        <div className="space-y-3">
          {foodReplacements.map((replacement) => (
            <div
              key={replacement.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-medium">❌</span>
                <span className="text-sm text-gray-700 line-through">
                  {replacement.bad}
                </span>
              </div>
              <ArrowRight className="text-gray-400" size={16} />
              <div className="flex items-center gap-2">
                <span className="text-[#22C55E] font-medium">✅</span>
                <span className="text-sm font-semibold text-gray-900">
                  {replacement.good}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personalized Plan Button */}
      <button className="w-full h-14 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#16a34a] hover:from-[#16a34a] hover:to-[#22C55E] text-white shadow-lg shadow-[#22C55E]/30 text-base font-semibold flex items-center justify-center gap-2 transition-all">
        <Sparkles size={20} />
        <span>Generate Weekly Diet Plan</span>
      </button>
    </div>
  );
}
