import { useNavigate } from "react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";
import WeeklyNutritionReport from "../components/WeeklyNutritionReport";

export default function WeeklyReportScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#22C55E] to-[#16a34a] px-6 py-4 sticky top-0 z-10 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="text-white" size={24} />
          </button>
          <h1 className="font-semibold text-lg text-white">Weekly Report</h1>
          <Sparkles className="text-white" size={24} />
        </div>
        <p className="text-white/90 text-sm">
          Comprehensive analysis of your weekly nutrition
        </p>
      </div>

      {/* Content */}
      <div className="px-6 mt-6 mb-6">
        <WeeklyNutritionReport />
      </div>

      <BottomNavigation />
    </div>
  );
}
