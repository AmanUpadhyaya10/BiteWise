import { Line } from "recharts";
import { LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useId } from "react";

interface WeeklyChartProps {
  data: { day: string; value: number }[];
  color?: string;
  label?: string;
}

export default function WeeklyChart({ data, color = "#22C55E", label }: WeeklyChartProps) {
  // Generate a unique ID for this chart instance using React's useId hook
  const chartId = useId();
  
  return (
    <div className="w-full">
      {label && <h4 className="font-medium text-gray-900 mb-4">{label}</h4>}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} id={chartId}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" key={`${chartId}-grid`} />
          <XAxis dataKey="day" stroke="#6B7280" fontSize={12} key={`${chartId}-xaxis`} />
          <YAxis stroke="#6B7280" fontSize={12} key={`${chartId}-yaxis`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
            }}
            key={`${chartId}-tooltip`}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
            key={`${chartId}-line`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}