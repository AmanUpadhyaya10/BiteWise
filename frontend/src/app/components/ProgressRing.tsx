interface ProgressRingProps {
  percentage?: number;
  value?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  unit?: string;
}

export default function ProgressRing({
  percentage,
  value,
  max,
  size = 80,
  strokeWidth = 8,
  color = "#22C55E",
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let progress = 0;
  if (percentage !== undefined) {
    progress = Math.min(Math.max(isNaN(percentage) ? 0 : percentage, 0), 100);
  } else if (value !== undefined && max !== undefined) {
    const safeMax = max > 0 ? max : 1;
    const safeVal = isNaN(value) ? 0 : value;
    progress = Math.min((safeVal / safeMax) * 100, 100);
  }

  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {value !== undefined ? (
            <>
              <span className="font-semibold text-sm">{Math.round(value)}</span>
              <span className="text-xs opacity-70">/ {max ?? 100}</span>
            </>
          ) : (
            <span className="font-semibold text-sm">{Math.round(progress)}%</span>
          )}
        </div>
      </div>
      {label && <span className="text-sm text-gray-600 mt-2">{label}</span>}
    </div>
  );
}