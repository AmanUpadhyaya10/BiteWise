import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Search, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, Cell } from "recharts";
import BottomNavigation from "../components/BottomNavigation";

export default function FoodComparisonScreen() {
  const navigate = useNavigate();
  const [food1, setFood1] = useState("Rice");
  const [food2, setFood2] = useState("Quinoa");

  const foodDatabase: { [key: string]: any } = {
    Rice: {
      name: "White Rice",
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop",
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      fiber: 0.4,
      iron: 0.2,
      calcium: 10,
    },
    Quinoa: {
      name: "Quinoa",
      image: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&h=300&fit=crop",
      calories: 120,
      protein: 4.4,
      carbs: 21,
      fat: 1.9,
      fiber: 2.8,
      iron: 1.5,
      calcium: 17,
    },
    Chicken: {
      name: "Chicken Breast",
      image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=300&fit=crop",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      iron: 0.9,
      calcium: 15,
    },
    Tofu: {
      name: "Tofu",
      image: "https://images.unsplash.com/photo-1546548970-71785318a17b?w=400&h=300&fit=crop",
      calories: 76,
      protein: 8,
      carbs: 1.9,
      fat: 4.8,
      fiber: 0.3,
      iron: 1.6,
      calcium: 350,
    },
  };

  const foods = Object.keys(foodDatabase);
  const selectedFood1 = foodDatabase[food1];
  const selectedFood2 = foodDatabase[food2];

  const comparisonData = [
    {
      name: "Calories",
      food1: selectedFood1.calories,
      food2: selectedFood2.calories,
    },
    {
      name: "Protein (g)",
      food1: selectedFood1.protein,
      food2: selectedFood2.protein,
    },
    {
      name: "Carbs (g)",
      food1: selectedFood1.carbs,
      food2: selectedFood2.carbs,
    },
    {
      name: "Fat (g)",
      food1: selectedFood1.fat,
      food2: selectedFood2.fat,
    },
    {
      name: "Fiber (g)",
      food1: selectedFood1.fiber,
      food2: selectedFood2.fiber,
    },
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
          <h1 className="font-semibold text-lg">Compare Foods</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Food Selection */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
            {/* Food 1 */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">
                Food 1
              </label>
              <select
                value={food1}
                onChange={(e) => setFood1(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 font-medium"
              >
                {foods.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* VS */}
            <div className="text-center pt-6">
              <div className="w-10 h-10 bg-[#22C55E]/10 rounded-full flex items-center justify-center">
                <span className="text-[#22C55E] font-bold text-sm">VS</span>
              </div>
            </div>

            {/* Food 2 */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">
                Food 2
              </label>
              <select
                value={food2}
                onChange={(e) => setFood2(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 font-medium"
              >
                {foods.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Food Cards */}
      <div className="px-6 mt-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Food 1 Card */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border-2 border-blue-200">
            <img
              src={selectedFood1.image}
              alt={selectedFood1.name}
              className="w-full h-32 object-cover"
            />
            <div className="p-4 bg-blue-50">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                {selectedFood1.name}
              </h3>
              <p className="text-xs text-gray-600">Per 100g serving</p>
            </div>
          </div>

          {/* Food 2 Card */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border-2 border-green-200">
            <img
              src={selectedFood2.image}
              alt={selectedFood2.name}
              className="w-full h-32 object-cover"
            />
            <div className="p-4 bg-green-50">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                {selectedFood2.name}
              </h3>
              <p className="text-xs text-gray-600">Per 100g serving</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">
            Nutritional Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData} layout="horizontal" id="food-comparison-chart">
              <XAxis type="number" fontSize={12} key="comparison-xaxis" />
              <YAxis dataKey="name" type="category" fontSize={12} width={80} key="comparison-yaxis" />
              <Legend key="comparison-legend" />
              <Bar
                dataKey="food1"
                fill="#3B82F6"
                name={selectedFood1.name}
                radius={[0, 8, 8, 0]}
                key="comparison-bar-food1"
              />
              <Bar
                dataKey="food2"
                fill="#22C55E"
                name={selectedFood2.name}
                radius={[0, 8, 8, 0]}
                key="comparison-bar-food2"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Comparison */}
      <div className="px-6 mt-6 mb-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">
            Detailed Breakdown
          </h3>
          <div className="space-y-4">
            {comparisonData.map((item, index) => (
              <div key={index}>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {item.name}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-xs text-blue-600 mb-1">
                      {selectedFood1.name}
                    </p>
                    <p className="text-lg font-bold text-blue-800">
                      {item.food1}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs text-green-600 mb-1">
                      {selectedFood2.name}
                    </p>
                    <p className="text-lg font-bold text-green-800">
                      {item.food2}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}