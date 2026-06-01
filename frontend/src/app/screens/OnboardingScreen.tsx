import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { api, auth } from "../api";

interface OnboardingData {
  gender: "male" | "female" | "";
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  heightCm: string;
  weightKg: string;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active" | "";
  goal: "lose" | "maintain" | "gain" | "";
}

const ACTIVITY_OPTIONS = [
  { value: "sedentary",  label: "Sedentary",    desc: "Little or no exercise, desk job" },
  { value: "light",      label: "Lightly Active", desc: "1–3 days/week light exercise" },
  { value: "moderate",   label: "Moderately Active", desc: "3–5 days/week moderate exercise" },
  { value: "active",     label: "Very Active",   desc: "6–7 days/week hard exercise" },
  { value: "very_active",label: "Extra Active",  desc: "Athlete, physical job + training" },
];

const GOAL_OPTIONS = [
  { value: "lose",     label: "Lose Weight",    emoji: "📉", desc: "Calorie deficit" },
  { value: "maintain", label: "Maintain Weight", emoji: "⚖️", desc: "Balanced intake" },
  { value: "gain",     label: "Gain Muscle",    emoji: "💪", desc: "Calorie surplus" },
];

// Mifflin-St Jeor BMR → TDEE → macro split
function calculateGoals(data: OnboardingData) {
  const age = new Date().getFullYear() - parseInt(data.birthYear);
  const h   = parseFloat(data.heightCm);
  const w   = parseFloat(data.weightKg);

  // BMR
  let bmr = data.gender === "male"
    ? 10 * w + 6.25 * h - 5 * age + 5
    : 10 * w + 6.25 * h - 5 * age - 161;

  // Activity multiplier
  const multipliers: Record<string, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
  };
  let tdee = bmr * (multipliers[data.activityLevel] ?? 1.55);

  // Goal adjustment
  if (data.goal === "lose")   tdee -= 500;
  if (data.goal === "gain")   tdee += 300;

  const calories = Math.round(tdee);
  // Macro split: 30% protein, 40% carbs, 30% fat (lose); 25/45/30 (maintain); 30/40/30 (gain)
  const proteinPct = data.goal === "lose" ? 0.35 : data.goal === "gain" ? 0.30 : 0.25;
  const carbsPct   = data.goal === "lose" ? 0.35 : data.goal === "gain" ? 0.45 : 0.50;
  const fatPct     = 1 - proteinPct - carbsPct;

  return {
    calories,
    protein: Math.round((calories * proteinPct) / 4),
    carbs:   Math.round((calories * carbsPct)   / 4),
    fat:     Math.round((calories * fatPct)      / 9),
    fiber:   data.gender === "male" ? 38 : 25,
  };
}

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    gender: "", birthYear: "", birthMonth: "", birthDay: "",
    heightCm: "", weightKg: "", activityLevel: "", goal: "",
  });

  const isValid = () => {
    switch (step) {
      case 1: return data.gender !== "";
      case 2: return data.birthYear.length === 4 && data.birthMonth !== "" && data.birthDay !== "";
      case 3: return data.heightCm !== "" && parseFloat(data.heightCm) > 50;
      case 4: return data.weightKg !== "" && parseFloat(data.weightKg) > 20;
      case 5: return data.activityLevel !== "";
      case 6: return data.goal !== "";
      default: return false;
    }
  };

  const handleNext = async () => {
    if (step < totalSteps) { setStep(step + 1); return; }

    // Final step — calculate and save
    setSaving(true);
    try {
      const goals = calculateGoals(data);
      await api.updateGoals(goals);
      localStorage.setItem("onboardingCompleted", "true");
      navigate("/home");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const RadioOption = ({ value, label, desc, current, onSelect }: any) => (
    <button onClick={() => onSelect(value)}
      className={`w-full px-5 py-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${
        current === value ? "border-[#22C55E] bg-[#22C55E]/5" : "border-gray-200 bg-gray-50"}`}>
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {desc && <p className="text-sm text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
        current === value ? "border-[#22C55E]" : "border-gray-300"}`}>
        {current === value && <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />}
      </div>
    </button>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return (
        <div className="space-y-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">What's your gender?</h2>
            <p className="text-sm text-gray-500 mt-2">Used to calculate your metabolic rate accurately</p>
          </div>
          <RadioOption value="male"   label="Male"   current={data.gender} onSelect={(v: any) => setData({...data, gender: v})} />
          <RadioOption value="female" label="Female" current={data.gender} onSelect={(v: any) => setData({...data, gender: v})} />
        </div>
      );

      case 2: return (
        <div className="space-y-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Date of Birth</h2>
            <p className="text-sm text-gray-500 mt-2">Used to calculate age-based calorie needs</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Day",   key: "birthDay",   placeholder: "DD",   max: 2 },
              { label: "Month", key: "birthMonth", placeholder: "MM",   max: 2 },
              { label: "Year",  key: "birthYear",  placeholder: "YYYY", max: 4 },
            ].map(({ label, key, placeholder, max }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1.5 block">{label}</label>
                <input type="number" placeholder={placeholder} maxLength={max}
                  value={(data as any)[key]}
                  onChange={(e) => setData({...data, [key]: e.target.value})}
                  className="w-full px-3 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#22C55E] text-gray-900 text-center text-lg" />
              </div>
            ))}
          </div>
        </div>
      );

      case 3: return (
        <div className="space-y-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Your Height</h2>
            <p className="text-sm text-gray-500 mt-2">In centimeters</p>
          </div>
          <div className="relative">
            <input type="number" placeholder="e.g. 170"
              value={data.heightCm}
              onChange={(e) => setData({...data, heightCm: e.target.value})}
              className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#22C55E] text-gray-900 text-2xl text-center" />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">cm</span>
          </div>
          <p className="text-center text-sm text-gray-400">5 ft 7 in = 170 cm · 5 ft = 152 cm</p>
        </div>
      );

      case 4: return (
        <div className="space-y-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Your Weight</h2>
            <p className="text-sm text-gray-500 mt-2">In kilograms</p>
          </div>
          <div className="relative">
            <input type="number" placeholder="e.g. 70"
              value={data.weightKg}
              onChange={(e) => setData({...data, weightKg: e.target.value})}
              className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#22C55E] text-gray-900 text-2xl text-center" />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">kg</span>
          </div>
          <p className="text-center text-sm text-gray-400">150 lbs = 68 kg · 180 lbs = 82 kg</p>
        </div>
      );

      case 5: return (
        <div className="space-y-3">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Activity Level</h2>
            <p className="text-sm text-gray-500 mt-2">How active are you on a typical week?</p>
          </div>
          {ACTIVITY_OPTIONS.map((o) => (
            <RadioOption key={o.value} value={o.value} label={o.label} desc={o.desc}
              current={data.activityLevel}
              onSelect={(v: any) => setData({...data, activityLevel: v})} />
          ))}
        </div>
      );

      case 6: return (
        <div className="space-y-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Your Goal</h2>
            <p className="text-sm text-gray-500 mt-2">We'll set your daily targets based on this</p>
          </div>
          {GOAL_OPTIONS.map((o) => (
            <button key={o.value} onClick={() => setData({...data, goal: o.value as any})}
              className={`w-full px-5 py-5 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${
                data.goal === o.value ? "border-[#22C55E] bg-[#22C55E]/5" : "border-gray-200 bg-gray-50"}`}>
              <span className="text-3xl">{o.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{o.label}</p>
                <p className="text-sm text-gray-500">{o.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                data.goal === o.value ? "border-[#22C55E]" : "border-gray-300"}`}>
                {data.goal === o.value && <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />}
              </div>
            </button>
          ))}

          {/* Preview calculated goals */}
          {data.goal && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-green-800 mb-2">📊 Your calculated daily targets:</p>
              {(() => {
                const g = calculateGoals(data);
                return (
                  <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                    <span>🔥 Calories: <b>{g.calories} kcal</b></span>
                    <span>🥩 Protein: <b>{g.protein}g</b></span>
                    <span>🌾 Carbs: <b>{g.carbs}g</b></span>
                    <span>🫒 Fat: <b>{g.fat}g</b></span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto flex flex-col">
      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
          ) : <div className="w-9" />}
          <span className="text-sm text-gray-500 font-medium">Step {step} of {totalSteps}</span>
          <div className="w-9" />
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#22C55E] rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">{renderStep()}</div>

      {/* Button */}
      <div className="px-6 pb-10 pt-4">
        <button onClick={handleNext} disabled={!isValid() || saving}
          className="w-full bg-[#22C55E] text-white py-4 rounded-2xl font-semibold shadow-lg shadow-[#22C55E]/30 disabled:opacity-40 flex items-center justify-center gap-2">
          {saving ? "Saving..." : step === totalSteps ? "Let's Go! 🚀" : "Continue"}
          {!saving && <ChevronRight size={20} />}
        </button>
      </div>
    </div>
  );
}