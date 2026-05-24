import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import BottomNavigation from "../components/BottomNavigation";

export default function FoodDetailsScreen() {
  const navigate = useNavigate();
  const [portion, setPortion] = useState(1);

  const nutritionInfo = [
    { label: "Calories", value: 200, unit: "kcal" },
    { label: "Protein", value: 7, unit: "g" },
    { label: "Carbohydrates", value: 45, unit: "g" },
    { label: "Dietary Fiber", value: 3, unit: "g" },
    { label: "Sugars", value: 1, unit: "g" },
    { label: "Fat", value: 1, unit: "g" },
    { label: "Saturated Fat", value: 0.3, unit: "g" },
    { label: "Sodium", value: 5, unit: "mg" },
  ];

  const vitamins = [
    { label: "Vitamin A", value: 0, unit: "IU" },
    { label: "Vitamin C", value: 0, unit: "mg" },
    { label: "Calcium", value: 20, unit: "mg" },
    { label: "Iron", value: 1.2, unit: "mg" },
  ];

  const adjustPortion = (delta: number) => {
    setPortion(Math.max(0.5, portion + delta));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/result")}
            className="w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-semibold text-lg">Food Details</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Food Image */}
      <div className="relative">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=400&fit=crop"
          alt="Rice"
          className="w-full h-64 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <h2 className="text-2xl font-bold text-white">White Rice</h2>
          <p className="text-white/80">Cooked, plain</p>
        </div>
      </div>

      {/* Portion Size Selector */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Portion Size
          </h3>
          <div className="flex items-center justify-between">
            <button
              onClick={() => adjustPortion(-0.5)}
              className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Minus size={20} />
            </button>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{portion}</p>
              <p className="text-sm text-gray-500">cup (150g)</p>
            </div>
            <button
              onClick={() => adjustPortion(0.5)}
              className="w-12 h-12 bg-[#22C55E] rounded-full flex items-center justify-center hover:bg-[#1ea34d] transition-colors text-white"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Nutritional Information */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Nutritional Information
          </h3>
          <div className="space-y-4">
            {nutritionInfo.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <span className="text-gray-700">{item.label}</span>
                <span className="font-semibold text-gray-900">
                  {(item.value * portion).toFixed(1)} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vitamins & Minerals */}
      <div className="px-6 mt-6 mb-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Vitamins & Minerals
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {vitamins.map((vitamin, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 mb-1">{vitamin.label}</p>
                <p className="font-semibold text-gray-900">
                  {(vitamin.value * portion).toFixed(1)} {vitamin.unit}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="px-6 mb-6">
        <button
          onClick={() => navigate("/home")}
          className="w-full bg-[#22C55E] text-white py-4 rounded-2xl font-semibold shadow-lg shadow-[#22C55E]/30 hover:bg-[#1ea34d] transition-colors"
        >
          Save Changes
        </button>
      </div>

      <BottomNavigation />
    </div>
  );
}
