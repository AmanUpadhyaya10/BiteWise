import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface InsightCardProps {
  type: "success" | "warning" | "info";
  message: string;
  trend?: "up" | "down" | "neutral";
}

export default function InsightCard({ type, message, trend }: InsightCardProps) {
  const colors = {
    success: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800" },
    warning: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800" },
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800" },
  };

  const icons = {
    up: <TrendingUp size={20} />,
    down: <TrendingDown size={20} />,
    neutral: <Minus size={20} />,
  };

  const style = colors[type];

  return (
    <div
      className={`${style.bg} ${style.border} border-2 rounded-2xl p-4 flex items-start gap-3`}
    >
      {trend && <div className={style.text}>{icons[trend]}</div>}
      <p className={`${style.text} font-medium flex-1`}>{message}</p>
    </div>
  );
}
