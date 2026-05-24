import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Filter } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";
import RecipeCard from "../components/RecipeCard";

export default function RecipesScreen() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = ["All", "Breakfast", "Lunch", "Dinner", "Snacks"];

  const recipes = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&h=300&fit=crop",
      title: "Protein Oatmeal Bowl",
      calories: 320,
      cookingTime: 10,
      protein: 15,
      carbs: 45,
      fat: 8,
      category: "breakfast",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
      title: "Healthy Buddha Bowl",
      calories: 450,
      cookingTime: 25,
      protein: 22,
      carbs: 55,
      fat: 12,
      category: "lunch",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop",
      title: "Grilled Chicken Salad",
      calories: 380,
      cookingTime: 20,
      protein: 35,
      carbs: 20,
      fat: 15,
      category: "lunch",
    },
    {
      id: 4,
      image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop",
      title: "Salmon with Quinoa",
      calories: 520,
      cookingTime: 30,
      protein: 38,
      carbs: 42,
      fat: 18,
      category: "dinner",
    },
    {
      id: 5,
      image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop",
      title: "Avocado Toast",
      calories: 280,
      cookingTime: 5,
      protein: 8,
      carbs: 32,
      fat: 14,
      category: "breakfast",
    },
    {
      id: 6,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
      title: "Veggie Stir Fry",
      calories: 350,
      cookingTime: 15,
      protein: 12,
      carbs: 48,
      fat: 10,
      category: "dinner",
    },
  ];

  const filteredRecipes =
    activeFilter === "all"
      ? recipes
      : recipes.filter((recipe) => recipe.category === activeFilter);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Healthy Recipes
        </h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search recipes..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 focus:border-[#22C55E]"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter.toLowerCase())}
              className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                activeFilter === filter.toLowerCase()
                  ? "bg-[#22C55E] text-white shadow-lg shadow-[#22C55E]/30"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Recipe */}
      <div className="px-6 mt-6">
        <div className="bg-gradient-to-br from-[#22C55E] to-[#16a34a] rounded-3xl p-6 text-white shadow-xl mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⭐</span>
            <span className="text-sm text-white/80 font-medium">
              Recipe of the Day
            </span>
          </div>
          <h3 className="text-xl font-bold mb-2">Mediterranean Quinoa Bowl</h3>
          <p className="text-white/90 text-sm mb-4">
            A delicious and nutritious bowl packed with protein and healthy fats
          </p>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span>🔥</span>
              <span>480 kcal</span>
            </div>
            <div className="flex items-center gap-1">
              <span>⏱️</span>
              <span>20 min</span>
            </div>
            <div className="flex items-center gap-1">
              <span>💪</span>
              <span>28g protein</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="px-6 mt-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            {activeFilter === "all" ? "All Recipes" : `${filters.find(f => f.toLowerCase() === activeFilter)} Recipes`}
          </h3>
          <button className="text-[#22C55E] text-sm font-medium flex items-center gap-1">
            <Filter size={16} />
            Sort
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              image={recipe.image}
              title={recipe.title}
              calories={recipe.calories}
              cookingTime={recipe.cookingTime}
              protein={recipe.protein}
              carbs={recipe.carbs}
              fat={recipe.fat}
            />
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
