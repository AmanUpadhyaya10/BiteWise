import { useNavigate } from "react-router";
import { Zap, Camera, TrendingUp, Award } from "lucide-react";

export default function WelcomeScreen() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    navigate("/onboarding");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#22C55E] to-[#16A34A] max-w-md mx-auto flex flex-col items-center justify-between p-8 text-white">
      {/* Logo and Title */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
          <Zap className="text-[#22C55E]" size={48} fill="#22C55E" />
        </div>
        <h1 className="text-4xl font-bold mb-3">BitWise</h1>
        <p className="text-white/80 text-lg">
          Bite smarter, live better
        </p>
      </div>

      {/* Features */}
      <div className="space-y-4 mb-8 w-full">
        <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Camera size={20} />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Instant Food Recognition</h3>
            <p className="text-sm text-white/70">
              Scan any meal and get instant nutrition data
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Track Your Progress</h3>
            <p className="text-sm text-white/70">
              Monitor your nutrition goals and build healthy habits
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Award size={20} />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Earn Achievements</h3>
            <p className="text-sm text-white/70">
              Stay motivated with streaks and rewards
            </p>
          </div>
        </div>
      </div>

      {/* Get Started Button */}
      <button
        onClick={handleGetStarted}
        className="w-full bg-white text-[#22C55E] py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all"
      >
        Get Started
      </button>
    </div>
  );
}