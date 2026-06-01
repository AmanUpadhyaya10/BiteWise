import { Lock } from "lucide-react";

interface AchievementBadgeProps {
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export default function AchievementBadge({
  icon,
  title,
  description,
  unlocked,
}: AchievementBadgeProps) {
  return (
    <div
      className={`rounded-2xl p-4 border transition-all ${
        unlocked
          ? "bg-white border-green-200 shadow-sm hover:shadow-md"
          : "bg-gray-50 border-gray-200 opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`text-3xl flex-shrink-0 ${
            unlocked ? "" : "grayscale opacity-50"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
            {!unlocked && <Lock size={14} className="text-gray-400" />}
          </div>
          <p className="text-xs text-gray-600 mt-0.5">{description}</p>
        </div>
        {unlocked && (
          <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-green-600 text-sm">✓</span>
          </div>
        )}
      </div>
    </div>
  );
}