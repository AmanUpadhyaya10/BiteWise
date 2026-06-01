import { ImageWithFallback } from "./figma/ImageWithFallback";

interface FoodListItemProps {
  name: string;
  calories: number;
  image?: string;
  time?: string;
  portion?: string;
}

export default function FoodListItem({
  name,
  calories,
  image,
  time,
  portion,
}: FoodListItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
      {image && (
        <ImageWithFallback
          src={image}
          alt={name}
          className="w-16 h-16 rounded-lg object-cover"
        />
      )}
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{name}</h4>
        {time && <p className="text-xs text-gray-500">{time}</p>}
        {portion && <p className="text-xs text-gray-500">{portion}</p>}
      </div>
      <div className="text-right">
        <p className="font-semibold text-[#22C55E]">{calories}</p>
        <p className="text-xs text-gray-500">kcal</p>
      </div>
    </div>
  );
}
