import { useState } from "react";
import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import CalendarBottomSheet from "../components/CalendarBottomSheet";

interface DayData {
  date: Date;
  status: "completed" | "partial" | "low" | "none";
  calories: number;
  goal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  mealsLogged: number;
}

export default function CalendarDemoScreen() {
  const navigate = useNavigate();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState<{
    date: Date;
    data: DayData;
  } | null>(null);

  const handleDateSelect = (date: Date, data: DayData) => {
    setSelectedDateInfo({ date, data });
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Calendar Demo</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#22C55E] to-[#16a34a] rounded-3xl p-8 text-white shadow-lg mb-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Nutrition Calendar</h2>
          <p className="text-white/90 text-sm">
            Track your daily nutrition progress and view historical data
          </p>
        </div>

        {/* Open Calendar Button */}
        <button
          onClick={() => setIsCalendarOpen(true)}
          className="w-full h-14 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-white shadow-lg shadow-[#22C55E]/30 text-base font-semibold mb-6 flex items-center justify-center gap-2 transition-all"
        >
          <CalendarIcon size={20} />
          <span>Open Calendar</span>
        </button>

        {/* Features List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Features</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Visual Progress Indicators
                </p>
                <p className="text-sm text-gray-600">
                  Color-coded circles show nutrition completion status
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Meal Tracking Dots</p>
                <p className="text-sm text-gray-600">
                  Small dots indicate number of meals logged per day
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Detailed Nutrition Summary
                </p>
                <p className="text-sm text-gray-600">
                  View calories, protein, carbs, fat, and fiber for any date
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Month Navigation</p>
                <p className="text-sm text-gray-600">
                  Easily browse through past and future months
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Date Info */}
        {selectedDateInfo && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Last Selected Date</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Date</span>
                <span className="font-semibold text-gray-900">
                  {selectedDateInfo.date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedDateInfo.data.status === "completed"
                      ? "bg-[#22C55E] text-white"
                      : selectedDateInfo.data.status === "partial"
                        ? "bg-yellow-400 text-gray-900"
                        : selectedDateInfo.data.status === "low"
                          ? "bg-red-400 text-white"
                          : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {selectedDateInfo.data.status === "completed"
                    ? "Goal Met"
                    : selectedDateInfo.data.status === "partial"
                      ? "Partial"
                      : selectedDateInfo.data.status === "low"
                        ? "Low"
                        : "No Data"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Calories</span>
                <span className="font-semibold text-gray-900">
                  {selectedDateInfo.data.calories} / {selectedDateInfo.data.goal}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Meals Logged</span>
                <span className="font-semibold text-gray-900">
                  {selectedDateInfo.data.mealsLogged}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <CalendarBottomSheet
        open={isCalendarOpen}
        onOpenChange={setIsCalendarOpen}
        onDateSelect={handleDateSelect}
      />
    </div>
  );
}
