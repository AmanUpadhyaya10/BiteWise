import { useNavigate } from "react-router";
import { ArrowLeft, Award } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";
import AchievementBadge from "../components/AchievementBadge";
import StreakCounter from "../components/StreakCounter";

export default function AchievementsScreen() {
  const navigate = useNavigate();

  const achievements = [
    {
      icon: "🔥",
      title: "Week Warrior",
      description: "Logged meals for 7 consecutive days",
      unlocked: true,
    },
    {
      icon: "💪",
      title: "Protein Pro",
      description: "Reached protein goal 5 days in a row",
      unlocked: true,
    },
    {
      icon: "🎯",
      title: "Goal Getter",
      description: "Stayed within calorie target for 10 days",
      unlocked: true,
    },
    {
      icon: "📸",
      title: "Scanner Master",
      description: "Scanned 50 meals",
      unlocked: false,
    },
    {
      icon: "🥗",
      title: "Balanced Life",
      description: "Maintained balanced macros for 14 days",
      unlocked: false,
    },
    {
      icon: "⭐",
      title: "Century Club",
      description: "Logged 100 meals",
      unlocked: false,
    },
    {
      icon: "🏆",
      title: "Consistency King",
      description: "30 day streak",
      unlocked: false,
    },
    {
      icon: "🌟",
      title: "Nutrition Expert",
      description: "Reached all daily goals for 30 days",
      unlocked: false,
    },
  ];

  const stats = [
    { label: "Total Meals Logged", value: 42, color: "#22C55E" },
    { label: "Days Active", value: 15, color: "#3B82F6" },
    { label: "Goals Achieved", value: 8, color: "#F59E0B" },
    { label: "Achievements Unlocked", value: 3, color: "#EF4444" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-500 to-orange-500 px-6 py-4 sticky top-0 z-10 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/home")}
            className="w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="text-white" size={24} />
          </button>
          <h1 className="font-semibold text-lg text-white">Achievements</h1>
          <Award className="text-white" size={24} />
        </div>
        <p className="text-white/90 text-sm">
          Track your progress and unlock rewards
        </p>
      </div>

      {/* Streak */}
      <div className="px-6 mt-6">
        <StreakCounter days={5} />
      </div>

      {/* Stats */}
      <div className="px-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Your Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p
                className="text-3xl font-bold"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Achievement Progress</h3>
            <span className="text-sm text-gray-600">
              {achievements.filter((a) => a.unlocked).length} / {achievements.length}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
              style={{
                width: `${
                  (achievements.filter((a) => a.unlocked).length /
                    achievements.length) *
                  100
                }%`,
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {Math.round(
              (achievements.filter((a) => a.unlocked).length /
                achievements.length) *
                100
            )}
            % Complete
          </p>
        </div>
      </div>

      {/* Achievements */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Unlocked</h3>
          <span className="text-sm text-[#22C55E] font-medium">
            {achievements.filter((a) => a.unlocked).length} achievements
          </span>
        </div>
        <div className="space-y-3 mb-6">
          {achievements
            .filter((a) => a.unlocked)
            .map((achievement, index) => (
              <AchievementBadge
                key={index}
                icon={achievement.icon}
                title={achievement.title}
                description={achievement.description}
                unlocked={achievement.unlocked}
              />
            ))}
        </div>

        <h3 className="font-semibold text-gray-900 mb-4">Locked</h3>
        <div className="space-y-3 mb-6">
          {achievements
            .filter((a) => !a.unlocked)
            .map((achievement, index) => (
              <AchievementBadge
                key={index}
                icon={achievement.icon}
                title={achievement.title}
                description={achievement.description}
                unlocked={achievement.unlocked}
              />
            ))}
        </div>
      </div>

      {/* Motivational Message */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-xl">
          <p className="text-2xl mb-2">🎉</p>
          <h3 className="font-bold text-lg mb-2">Keep Going!</h3>
          <p className="text-white/90 text-sm">
            You're doing great! Keep logging your meals to unlock more achievements.
          </p>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
