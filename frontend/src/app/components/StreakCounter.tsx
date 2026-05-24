import { Flame } from "lucide-react";

interface StreakCounterProps {
  days: number;
}

export default function StreakCounter({ days }: StreakCounterProps) {
  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 text-white shadow-xl">
      <div className="flex items-center gap-3 mb-2">
        <Flame size={32} className="animate-pulse" />
        <div>
          <p className="text-white/80 text-sm">Current Streak</p>
          <p className="text-4xl font-bold">{days} Days</p>
        </div>
      </div>
      <p className="text-white/90 text-sm mt-4">
        Keep it up! You're on a roll 🎉
      </p>
    </div>
  );
}
