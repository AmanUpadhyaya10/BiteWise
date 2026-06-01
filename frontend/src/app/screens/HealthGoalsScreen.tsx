import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Target, TrendingUp, TrendingDown, Minus } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";

export default function HealthGoalsScreen() {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState("lose");
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [age, setAge] = useState(28);
  const [activityLevel, setActivityLevel] = useState("moderate");

  const goals = [
    {
      id: "lose",
      icon: TrendingDown,
      title: "Lose Weight",
      description: "Reduce body fat and lose weight",
      color: "#EF4444",
    },
    {
      id: "gain",
      icon: TrendingUp,
      title: "Gain Muscle",
      description: "Build muscle and increase strength",
      color: "#3B82F6",
    },
    {
      id: "maintain",
      icon: Minus,
      title: "Maintain Weight",
      description: "Stay at your current weight",
      color: "#22C55E",
    },
  ];

  const activityLevels = [
    { id: "sedentary", label: "Sedentary", description: "Little to no exercise" },
    { id: "light", label: "Light", description: "1-3 days/week" },
    { id: "moderate", label: "Moderate", description: "3-5 days/week" },
    { id: "active", label: "Active", description: "6-7 days/week" },
    { id: "veryActive", label: "Very Active", description: "2x per day" },
  ];

  // Simple BMR calculation (Mifflin-St Jeor)
  const calculateBMR = () => {
    return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
  };

  const calculateCalories = () => {
    const bmr = calculateBMR();
    const activityMultipliers: { [key: string]: number } = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };
    const tdee = Math.round(bmr * activityMultipliers[activityLevel]);

    if (selectedGoal === "lose") return tdee - 500;
    if (selectedGoal === "gain") return tdee + 300;
    return tdee;
  };

  const dailyCalories = calculateCalories();

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#22C55E] to-[#16a34a] px-6 py-4 sticky top-0 z-10 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="text-white" size={24} />
          </button>
          <h1 className="font-semibold text-lg text-white">Health Goals</h1>
          <Target className="text-white" size={24} />
        </div>
        <p className="text-white/80 text-sm">
          Set your fitness goals and get personalized targets
        </p>
      </div>

      {/* Goal Selection */}
      <div className="px-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Select Your Goal</h3>
        <div className="space-y-3">
          {goals.map((goal) => {
            const Icon = goal.icon;
            const isSelected = selectedGoal === goal.id;
            return (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={`w-full p-5 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? "border-[#22C55E] bg-[#22C55E]/5"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${goal.color}20` }}
                  >
                    <Icon size={28} style={{ color: goal.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-[#22C55E] bg-[#22C55E]"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body Stats */}
      <div className="px-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Your Stats</h3>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (cm)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="140"
                max="220"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="flex-1"
              />
              <div className="w-16 text-center font-semibold bg-gray-100 rounded-lg py-2">
                {height}
              </div>
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (kg)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="40"
                max="150"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="flex-1"
              />
              <div className="w-16 text-center font-semibold bg-gray-100 rounded-lg py-2">
                {weight}
              </div>
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="18"
                max="80"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="flex-1"
              />
              <div className="w-16 text-center font-semibold bg-gray-100 rounded-lg py-2">
                {age}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Level */}
      <div className="px-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Activity Level</h3>
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 space-y-2">
          {activityLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => setActivityLevel(level.id)}
              className={`w-full p-4 rounded-xl text-left transition-all ${
                activityLevel === level.id
                  ? "bg-[#22C55E]/10 border-2 border-[#22C55E]"
                  : "bg-gray-50 border-2 border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{level.label}</p>
                  <p className="text-sm text-gray-600">{level.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    activityLevel === level.id
                      ? "border-[#22C55E] bg-[#22C55E]"
                      : "border-gray-300"
                  }`}
                >
                  {activityLevel === level.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Calculated Target */}
      <div className="px-6 mt-6 mb-6">
        <div className="bg-gradient-to-br from-[#22C55E] to-[#16a34a] rounded-3xl p-6 text-white shadow-xl">
          <p className="text-white/80 text-sm mb-2">Your Daily Calorie Target</p>
          <div className="flex items-end gap-2 mb-4">
            <p className="text-5xl font-bold">{dailyCalories}</p>
            <p className="text-xl text-white/80 mb-2">kcal/day</p>
          </div>
          <div className="pt-4 border-t border-white/20">
            <p className="text-sm text-white/90 mb-3">Recommended Macros:</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-white/80 text-xs mb-1">Protein</p>
                <p className="text-white font-semibold">
                  {Math.round(weight * 2)}g
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-white/80 text-xs mb-1">Carbs</p>
                <p className="text-white font-semibold">
                  {Math.round(dailyCalories * 0.45 / 4)}g
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-white/80 text-xs mb-1">Fat</p>
                <p className="text-white font-semibold">
                  {Math.round(dailyCalories * 0.25 / 9)}g
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="px-6 mb-6">
        <button
          onClick={() => navigate("/profile")}
          className="w-full bg-[#22C55E] text-white py-4 rounded-2xl font-semibold shadow-lg shadow-[#22C55E]/30"
        >
          Save Goals
        </button>
      </div>

      <BottomNavigation />
    </div>
  );
}
