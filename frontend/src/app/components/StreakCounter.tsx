import { Flame } from "lucide-react";

interface StreakCounterProps {
  days: number;
  message?: string;
}

export default function StreakCounter({ days, message = "Keep it up! You're on a roll" }: StreakCounterProps) {
  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 shadow-lg text-white">
      <div className="flex items-center gap-3 mb-2">
        <Flame size={28} className="text-yellow-200" />
        <div>
          <p className="text-sm text-white/80">Current Streak</p>
          <p className="text-4xl font-bold">{days} Days</p>
        </div>
      </div>
      <p className="text-white/90 text-sm">{message} 🔥</p>
    </div>
  );
}