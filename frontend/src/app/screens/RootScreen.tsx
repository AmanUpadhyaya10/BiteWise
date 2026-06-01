import { useEffect } from "react";
import { useNavigate } from "react-router";
import { auth } from "../api";

export default function RootScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboardingCompleted");
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    const userId = localStorage.getItem("user_id");
  
    if (!userId) {
      // Not logged in — always go to login
      navigate("/login");
    } else if (auth.isModerator()) {
      // Moderators go straight to moderator dashboard
      navigate("/moderator");
    } else if (onboardingCompleted === "true") {
      navigate("/home");
    } else if (hasSeenWelcome === "true") {
      navigate("/onboarding");
    } else {
      navigate("/welcome");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto border-4 border-[#22C55E] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
} 