interface NutritionCardProps {
  label: string;
  value: number;
  unit: string;
  color?: string;
  icon?: React.ReactNode;
}

export default function NutritionCard({
  label,
  value,
  unit,
  color = "#22C55E",
  icon,
}: NutritionCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-semibold" style={{ color }}>
            {value}
            <span className="text-sm text-gray-400 ml-1">{unit}</span>
          </p>
        </div>
        {icon && (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <div style={{ color }}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}
