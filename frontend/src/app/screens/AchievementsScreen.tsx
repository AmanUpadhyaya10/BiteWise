import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Award } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";
import AchievementBadge from "../components/AchievementBadge";
import StreakCounter from "../components/StreakCounter";
import { api, auth } from "../api";

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
}

interface AchievementStats {
  totalMealsLogged: number;
  daysActive: number;
  goalsAchieved: number;
  achievementsUnlocked: number;
  currentStreak: number;
}

export default function AchievementsScreen() {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats>({
    totalMealsLogged: 0,
    daysActive: 0,
    goalsAchieved: 0,
    achievementsUnlocked: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      navigate("/login");
      return;
    }
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const data = await api.getAchievements();
      setAchievements(data.achievements || []);
      setStats(data.stats || {
        totalMealsLogged: 0,
        daysActive: 0,
        goalsAchieved: 0,
        achievementsUnlocked: 0,
        currentStreak: 0,
      });
    } catch (error) {
      console.error("Failed to load achievements:", error);
      // Fallback to empty state
      setAchievements(getDefaultAchievements());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAchievements = (): Achievement[] => [
    {
      id: "week_warrior",
      icon: "🔥",
      title: "Week Warrior",
      description: "Logged meals for 7 consecutive days",
      unlocked: false,
    },
    {
      id: "protein_pro",
      icon: "💪",
      title: "Protein Pro",
      description: "Reached protein goal 5 days in a row",
      unlocked: false,
    },
    {
      id: "goal_getter",
      icon: "🎯",
      title: "Goal Getter",
      description: "Stayed within calorie target for 10 days",
      unlocked: false,
    },
    {
      id: "scanner_master",
      icon: "📸",
      title: "Scanner Master",
      description: "Scanned 50 meals",
      unlocked: false,
    },
    {
      id: "balanced_life",
      icon: "🥗",
      title: "Balanced Life",
      description: "Maintained balanced macros for 14 days",
      unlocked: false,
    },
    {
      id: "century_club",
      icon: "⭐",
      title: "Century Club",
      description: "Logged 100 meals",
      unlocked: false,
    },
    {
      id: "consistency_king",
      icon: "🏆",
      title: "Consistency King",
      description: "30 day streak",
      unlocked: false,
    },
    {
      id: "nutrition_expert",
      icon: "🌟",
      title: "Nutrition Expert",
      description: "Reached all daily goals for 30 days",
      unlocked: false,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading achievements...</p>
      </div>
    );
  }

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
        <StreakCounter
          days={stats.currentStreak}
          message={
            stats.currentStreak > 0
              ? `Keep it up! You're on a roll`
              : `Start logging meals to build a streak`
          }
        />
      </div>

      {/* Stats */}
      <div className="px-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Your Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Total Meals Logged</p>
            <p className="text-3xl font-bold text-green-500">
              {stats.totalMealsLogged}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Days Active</p>
            <p className="text-3xl font-bold text-blue-500">
              {stats.daysActive}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Goals Achieved</p>
            <p className="text-3xl font-bold text-amber-500">
              {stats.goalsAchieved}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">Achievements</p>
            <p className="text-3xl font-bold text-red-500">
              {stats.achievementsUnlocked}
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Achievement Progress</h3>
            <span className="text-sm text-gray-600">
              {unlockedCount} / {totalCount}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {Math.round(progressPercent)}% Complete
          </p>
        </div>
      </div>

      {/* Achievements */}
      <div className="px-6 mt-6">
        {achievements.filter((a) => a.unlocked).length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Unlocked</h3>
              <span className="text-sm text-green-500 font-medium">
                {achievements.filter((a) => a.unlocked).length} achievements
              </span>
            </div>
            <div className="space-y-3 mb-6">
              {achievements
                .filter((a) => a.unlocked)
                .map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    icon={achievement.icon}
                    title={achievement.title}
                    description={achievement.description}
                    unlocked={achievement.unlocked}
                  />
                ))}
            </div>
          </>
        )}

        {achievements.filter((a) => !a.unlocked).length > 0 && (
          <>
            <h3 className="font-semibold text-gray-900 mb-4">Locked</h3>
            <div className="space-y-3 mb-6">
              {achievements
                .filter((a) => !a.unlocked)
                .map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    icon={achievement.icon}
                    title={achievement.title}
                    description={achievement.description}
                    unlocked={achievement.unlocked}
                  />
                ))}
            </div>
          </>
        )}
      </div>

      {/* Motivational Message */}
      <div className="px-6 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-xl">
          <p className="text-2xl mb-2">🎉</p>
          <h3 className="font-bold text-lg mb-2">Keep Going!</h3>
          <p className="text-white/90 text-sm">
            You're doing great! Keep logging your meals to unlock more
            achievements.
          </p>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}