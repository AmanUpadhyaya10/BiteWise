import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Clock, Flame } from "lucide-react";

interface RecipeCardProps {
  image: string;
  title: string;
  calories: number;
  cookingTime: number;
  protein: number;
  carbs: number;
  fat: number;
  onClick?: () => void;
}

export default function RecipeCard({
  image,
  title,
  calories,
  cookingTime,
  protein,
  carbs,
  fat,
  onClick,
}: RecipeCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <ImageWithFallback src={image} alt={title} className="w-full h-40 object-cover" />
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Flame size={16} className="text-[#22C55E]" />
            <span>{calories} kcal</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={16} className="text-gray-400" />
            <span>{cookingTime} min</span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 bg-blue-50 rounded-lg px-2 py-1 text-center">
            <p className="text-xs text-blue-600">Protein</p>
            <p className="font-semibold text-blue-800">{protein}g</p>
          </div>
          <div className="flex-1 bg-orange-50 rounded-lg px-2 py-1 text-center">
            <p className="text-xs text-orange-600">Carbs</p>
            <p className="font-semibold text-orange-800">{carbs}g</p>
          </div>
          <div className="flex-1 bg-red-50 rounded-lg px-2 py-1 text-center">
            <p className="text-xs text-red-600">Fat</p>
            <p className="font-semibold text-red-800">{fat}g</p>
          </div>
        </div>
      </div>
    </div>
  );
}
