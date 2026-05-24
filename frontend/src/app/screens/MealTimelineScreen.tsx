import { useNavigate } from "react-router";
import { ArrowLeft, Plus } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import EmptyState from "../components/EmptyState";

export default function MealTimelineScreen() {
  const navigate = useNavigate();

  const meals = {
    breakfast: [
      {
        name: "Oatmeal Bowl",
        image: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&h=300&fit=crop",
        time: "8:30 AM",
        calories: 320,
        protein: 12,
        carbs: 45,
        fat: 8,
      },
    ],
    lunch: [
      {
        name: "Indian Thali",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
        time: "1:15 PM",
        calories: 550,
        protein: 28,
        carbs: 85,
        fat: 15,
      },
    ],
    snacks: [
      {
        name: "Mixed Nuts",
        image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop",
        time: "4:30 PM",
        calories: 180,
        protein: 8,
        carbs: 12,
        fat: 14,
      },
    ],
    dinner: [],
  };

  const mealSections = [
    { id: "breakfast", title: "Breakfast", icon: "🌅", color: "#F59E0B" },
    { id: "lunch", title: "Lunch", icon: "☀️", color: "#22C55E" },
    { id: "snacks", title: "Snacks", icon: "🍎", color: "#8B5CF6" },
    { id: "dinner", title: "Dinner", icon: "🌙", color: "#3B82F6" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/home")}
            className="w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-semibold text-lg">Meal Timeline</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Date & Summary */}
      <div className="px-6 mt-6">
        <div className="bg-gradient-to-br from-[#22C55E] to-[#16a34a] rounded-3xl p-6 text-white shadow-lg">
          <p className="text-white/80 text-sm mb-2">Today - March 7, 2026</p>
          <div className="flex items-end gap-2 mb-4">
            <p className="text-5xl font-bold">1,050</p>
            <p className="text-xl text-white/80 mb-2">kcal</p>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-white/80 text-xs">Protein</p>
              <p className="text-white font-semibold">48g</p>
            </div>
            <div>
              <p className="text-white/80 text-xs">Carbs</p>
              <p className="text-white font-semibold">142g</p>
            </div>
            <div>
              <p className="text-white/80 text-xs">Fat</p>
              <p className="text-white font-semibold">37g</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 mt-6 relative">
        {/* Timeline Line */}
        <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {mealSections.map((section, index) => {
          const sectionMeals = meals[section.id as keyof typeof meals];
          const hasNoMeals = sectionMeals.length === 0;

          return (
            <div key={section.id} className="relative mb-8">
              {/* Timeline Dot */}
              <div
                className="absolute left-8 w-5 h-5 rounded-full border-4 border-white shadow-lg z-10"
                style={{ backgroundColor: section.color }}
              ></div>

              {/* Section Header */}
              <div className="ml-16 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{section.icon}</span>
                  <h3 className="font-semibold text-gray-900">{section.title}</h3>
                </div>
              </div>

              {/* Meals */}
              <div className="ml-16 space-y-3">
                {hasNoMeals ? (
                  <button
                    onClick={() => navigate("/scan")}
                    className="w-full bg-white border-2 border-dashed border-gray-300 rounded-2xl p-4 hover:border-[#22C55E] transition-all flex items-center justify-center gap-2 text-gray-500 hover:text-[#22C55E]"
                  >
                    <Plus size={20} />
                    <span className="font-medium">Add {section.title}</span>
                  </button>
                ) : (
                  sectionMeals.map((meal, mealIndex) => (
                    <div
                      key={mealIndex}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
                    >
                      <div className="flex">
                        <ImageWithFallback
                          src={meal.image}
                          alt={meal.name}
                          className="w-24 h-24 object-cover"
                        />
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {meal.name}
                            </h4>
                            <span className="text-[#22C55E] font-bold text-sm">
                              {meal.calories}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            {meal.time}
                          </p>
                          <div className="flex gap-3 text-xs">
                            <span className="text-blue-600">P: {meal.protein}g</span>
                            <span className="text-orange-600">C: {meal.carbs}g</span>
                            <span className="text-red-600">F: {meal.fat}g</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Meal FAB */}
      <button
        onClick={() => navigate("/scan")}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#22C55E] rounded-full flex items-center justify-center shadow-xl shadow-[#22C55E]/40 hover:scale-110 transition-transform"
      >
        <Plus className="text-white" size={28} />
      </button>

      <BottomNavigation />
    </div>
  );
}
