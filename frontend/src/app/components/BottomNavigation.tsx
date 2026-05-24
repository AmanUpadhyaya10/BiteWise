import { Home, ScanLine, History, User, MessageCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router";

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: ScanLine, label: "Scan", path: "/scan" },
    { icon: MessageCircle, label: "AI Chat", path: "/chat" },
    { icon: History, label: "History", path: "/history" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isChat = item.path === "/chat";

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? isChat ? "text-violet-600" : "text-[#22C55E]"
                    : "text-muted-foreground"
                }`}
              >
                <div className={isChat && isActive ? "relative" : ""}>
                  <Icon size={22} />
                  {isChat && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full" />
                  )}
                </div>
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}