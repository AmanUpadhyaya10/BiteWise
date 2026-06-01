import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "./ui/sheet";

interface DayData {
  date: Date;
  status: "completed" | "partial" | "low" | "none";
  calories: number;
  goal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  mealsLogged: number;
}

interface NutritionData {
  [key: string]: DayData;
}

interface CalendarBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDateSelect?: (date: Date, data: DayData) => void;
}

// Mock nutrition data generator
const generateMockData = (date: Date): DayData => {
  const dateKey = date.toISOString().split("T")[0];
  const random = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  // Some dates have no data
  if (date.getDate() % 7 === 0) {
    return {
      date,
      status: "none",
      calories: 0,
      goal: 2000,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      mealsLogged: 0,
    };
  }

  const calories = random(1200, 2200);
  const goal = 2000;
  const percentage = (calories / goal) * 100;

  let status: "completed" | "partial" | "low" | "none";
  if (percentage >= 90) status = "completed";
  else if (percentage >= 50) status = "partial";
  else if (percentage > 0) status = "low";
  else status = "none";

  return {
    date,
    status,
    calories,
    goal,
    protein: random(40, 80),
    carbs: random(150, 250),
    fat: random(40, 70),
    fiber: random(15, 30),
    mealsLogged: random(2, 4),
  };
};

export default function CalendarBottomSheet({
  open,
  onOpenChange,
  onDateSelect,
}: CalendarBottomSheetProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    // Adjust for Monday start (0 = Sunday, 1 = Monday, etc.)
    const offset = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    for (let i = 0; i < offset; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  // Get nutrition data for a specific date
  const getNutritionData = (date: Date): DayData => {
    return generateMockData(date);
  };

  const selectedData = selectedDate ? getNutritionData(selectedDate) : null;

  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleDone = () => {
    if (selectedDate && selectedData) {
      onDateSelect?.(selectedDate, selectedData);
    }
    onOpenChange(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-[#22C55E]";
      case "partial":
        return "bg-yellow-400";
      case "low":
        return "bg-red-400";
      default:
        return "bg-gray-200";
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto rounded-t-3xl p-0">
        <div className="px-6 py-5">
          {/* Header */}
          <SheetHeader className="p-0 mb-5">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousMonth}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
              <SheetTitle className="text-xl font-bold text-gray-900">
                {monthNames[currentMonth.getMonth()]}, {currentMonth.getFullYear()}
              </SheetTitle>
              <button
                onClick={handleNextMonth}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRight size={20} className="text-gray-700" />
              </button>
            </div>
            <SheetDescription className="sr-only">
              Select a date to view nutrition data
            </SheetDescription>
          </SheetHeader>

          {/* Calendar Grid */}
          <div className="mb-5">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-gray-500 uppercase"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const data = getNutritionData(date);
                const todayClass = isToday(date) ? "ring-2 ring-[#22C55E]" : "";
                const selectedClass = isSelected(date)
                  ? "ring-2 ring-[#22C55E] bg-[#22C55E]/10"
                  : "";

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateClick(date)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative hover:bg-gray-50 transition-all ${todayClass} ${selectedClass}`}
                  >
                    {/* Date number */}
                    <span className="text-sm font-medium text-gray-900 mb-1">
                      {date.getDate()}
                    </span>

                    {/* Progress indicator circle */}
                    <div
                      className={`w-2 h-2 rounded-full ${getStatusColor(data.status)}`}
                    />

                    {/* Meal dots indicator */}
                    {data.mealsLogged > 0 && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {Array.from({ length: Math.min(data.mealsLogged, 3) }).map(
                          (_, i) => (
                            <div
                              key={i}
                              className="w-1 h-1 rounded-full bg-[#22C55E]/40"
                            />
                          )
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-5 px-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
              <span className="text-xs text-gray-600">Goal met</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="text-xs text-gray-600">Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-xs text-gray-600">Low</span>
            </div>
          </div>

          {/* Nutrition Summary Panel */}
          {selectedData && (
            <div className="bg-gradient-to-br from-[#22C55E]/10 to-[#16a34a]/10 rounded-2xl p-4 mb-5 border border-[#22C55E]/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">
                  {selectedDate?.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h4>
                {selectedData.mealsLogged > 0 && (
                  <span className="text-xs text-gray-600">
                    {selectedData.mealsLogged} meals logged
                  </span>
                )}
              </div>

              {selectedData.status !== "none" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Calories</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedData.calories}{" "}
                      <span className="text-sm font-normal text-gray-500">
                        / {selectedData.goal}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Protein</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedData.protein}
                      <span className="text-sm font-normal text-gray-500">g</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Carbs</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedData.carbs}
                      <span className="text-sm font-normal text-gray-500">g</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Fat</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedData.fat}
                      <span className="text-sm font-normal text-gray-500">g</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Fiber</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedData.fiber}
                      <span className="text-sm font-normal text-gray-500">g</span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">
                  No nutrition data available
                </p>
              )}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDone}
              disabled={!selectedDate}
              className="flex-1 h-12 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-white shadow-lg shadow-[#22C55E]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Done
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
