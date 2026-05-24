interface AchievementBadgeProps {
  icon: string;
  title: string;
  description: string;
  unlocked?: boolean;
}

export default function AchievementBadge({
  icon,
  title,
  description,
  unlocked = false,
}: AchievementBadgeProps) {
  return (
    <div
      className={`p-4 rounded-2xl border-2 transition-all ${
        unlocked
          ? "bg-gradient-to-br from-[#22C55E]/10 to-[#16a34a]/5 border-[#22C55E]"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
            unlocked ? "bg-[#22C55E]" : "bg-gray-300"
          }`}
        >
          {unlocked ? icon : "🔒"}
        </div>
        <div className="flex-1">
          <h4
            className={`font-semibold ${
              unlocked ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {title}
          </h4>
          <p
            className={`text-sm ${
              unlocked ? "text-gray-600" : "text-gray-400"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
