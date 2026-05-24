import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft, Save, CheckCircle, Flame, Trash2, Pencil, Plus, X, Check, Search, Loader2, ChevronDown
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import BottomNavigation from "../components/BottomNavigation";
import { api } from "../api";

interface TopKItem { label: string; confidence: number; }

interface FoodItem {
  name: string;
  portion: string;
  confidence: number;
  nutrition: { kcal: number | null; protein: number | null; carbs: number | null; fat: number | null } | null;
  top_k?: TopKItem[];   // top-5 from model
  scanId?: string;      // for feedback submission
  imageUrl?: string;    // for "Other" submission
  confirmed?: boolean;  // has user confirmed this item?
}

interface LocationState {
  scanId?: string;
  imageUrl?: string;
  foods?: FoodItem[];
}

const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1, kg: 1000, oz: 28.35, lb: 453.59,
  ml: 1, cup: 240, tbsp: 15, tsp: 5, serving: 100,
};
const UNITS = ["g", "kg", "oz", "lb", "ml", "cup", "tbsp", "tsp", "serving"];
const toGrams = (amount: string, unit: string) =>
  (parseFloat(amount) || 0) * (UNIT_TO_GRAMS[unit] ?? 1);
const emptyFood = (): FoodItem => ({
  name: "", portion: "100g", confidence: 100,
  nutrition: { kcal: null, protein: null, carbs: null, fat: null },
  confirmed: true,
});

function useNutritionSearch() {
  const [results, setResults] = useState<Array<{ food: string; score: number; nutrition: Record<string, number> }>>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const search = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await api.nutritionSearch(q.trim());
        setResults(res.results);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
  };
  const clear = () => { setResults([]); setLoading(false); };
  return { results, loading, search, clear };
}

function nutritionFromResult(n: Record<string, number>) {
  return {
    kcal:    n.kcal_100g    ?? n.kcal    ?? n.calories      ?? null,
    protein: n.protein_100g ?? n.protein  ?? null,
    carbs:   n.carbs_100g   ?? n.carbs    ?? n.carbohydrates ?? null,
    fat:     n.fat_100g     ?? n.fat      ?? null,
  };
}

// ── Top-5 Picker Modal ─────────────────────────────────────────────
function Top5Picker({
  food, onConfirm, onClose,
}: {
  food: FoodItem;
  onConfirm: (chosenLabel: string, isOther: boolean, customName?: string, customNutr?: FoodItem["nutrition"]) => void;
  onClose: () => void;
}) {
  const topK = food.top_k ?? [{ label: food.name, confidence: food.confidence / 100 }];
  const [selected, setSelected] = useState<string>(topK[0]?.label ?? "");
  const [isOther, setIsOther] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customNutr, setCustomNutr] = useState<FoodItem["nutrition"]>({ kcal: null, protein: null, carbs: null, fat: null });
  const otherSearch = useNutritionSearch();
  const [showOtherDropdown, setShowOtherDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (isOther && !customName.trim()) return;
    setSubmitting(true);
    try {
      if (food.scanId) {
        await api.submitFeedback(food.scanId, isOther ? customName.trim() : selected);
      }
    } catch { /* non-blocking */ }
    finally { setSubmitting(false); }
    onConfirm(
      isOther ? customName.trim() : selected,
      isOther,
      isOther ? customName.trim() : undefined,
      isOther ? customNutr : undefined,
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center px-4 pb-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900 text-lg">What food is this?</h3>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-5">Select the correct food from the predictions below</p>

        {/* Food image if available */}
        {food.imageUrl && (
          <img src={food.imageUrl} alt="Food" className="w-full h-32 object-cover rounded-2xl mb-4" />
        )}

        {/* Top-5 options */}
        <div className="space-y-2 mb-4">
          {topK.map((item) => (
            <button key={item.label} onClick={() => { setSelected(item.label); setIsOther(false); }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all ${
                !isOther && selected === item.label
                  ? "border-[#22C55E] bg-[#22C55E]/5"
                  : "border-gray-200 bg-gray-50"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  !isOther && selected === item.label ? "border-[#22C55E]" : "border-gray-300"}`}>
                  {!isOther && selected === item.label && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                  )}
                </div>
                <span className="font-medium text-gray-800 capitalize">
                  {item.label.replace(/_/g, " ")}
                </span>
              </div>
              <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                !isOther && selected === item.label
                  ? "bg-[#22C55E]/10 text-[#22C55E]"
                  : "bg-gray-100 text-gray-500"}`}>
                {Math.round(item.confidence * 100)}%
              </span>
            </button>
          ))}

          {/* Other option */}
          <button onClick={() => { setIsOther(true); setSelected(""); }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all ${
              isOther ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-gray-50"}`}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              isOther ? "border-orange-400" : "border-gray-300"}`}>
              {isOther && <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />}
            </div>
            <span className="font-medium text-gray-700">Other (not in list)</span>
            <ChevronDown size={16} className="ml-auto text-gray-400" />
          </button>
        </div>

        {/* Other — custom name input */}
        {isOther && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
            <p className="text-sm font-medium text-orange-800 mb-3">
              🆕 Your label will be sent for moderator review and used to improve the model!
            </p>

            <div className="relative mb-3">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Food Name *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                {otherSearch.loading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={13} />
                )}
                <input type="text" placeholder="Type food name…" value={customName}
                  onChange={(e) => {
                    setCustomName(e.target.value);
                    otherSearch.search(e.target.value);
                    setShowOtherDropdown(true);
                  }}
                  className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-orange-400" />
              </div>
              {showOtherDropdown && otherSearch.results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  {otherSearch.results.map((item) => (
                    <button key={item.food} onClick={() => {
                      setCustomName(item.food.replace(/_/g, " "));
                      setCustomNutr(nutritionFromResult(item.nutrition));
                      otherSearch.clear();
                      setShowOtherDropdown(false);
                    }} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800 capitalize">{item.food.replace(/_/g, " ")}</p>
                        <p className="text-xs text-gray-400">
                          {item.nutrition.kcal_100g ?? "—"} kcal · {item.nutrition.protein_100g ?? "—"}g protein
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Nutrition per 100g (optional)</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Calories", key: "kcal" as const, color: "text-orange-500" },
                { label: "Protein (g)", key: "protein" as const, color: "text-blue-500" },
                { label: "Carbs (g)", key: "carbs" as const, color: "text-amber-500" },
                { label: "Fat (g)", key: "fat" as const, color: "text-red-500" },
              ].map(({ label, key, color }) => (
                <div key={key}>
                  <label className={`text-xs font-medium mb-1 block ${color}`}>{label}</label>
                  <input type="number" min="0" placeholder="0"
                    value={customNutr?.[key]?.toString() ?? ""}
                    onChange={(e) => setCustomNutr({ ...customNutr!, [key]: parseFloat(e.target.value) || null })}
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleConfirm}
          disabled={submitting || (isOther && !customName.trim())}
          className="w-full bg-[#22C55E] text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          {submitting ? "Submitting…" : "Confirm & Continue"}
        </button>
      </div>
    </div>
  );
}

// ── Main Screen ────────────────────────────────────────────────────
export default function NutritionResultScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) ?? {};
  const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:8000";

  // Add confirmed flag and scanId/imageUrl to each food
  const initialFoods: FoodItem[] = (state.foods ?? [{
    name: "Rice", portion: "100g", confidence: 95,
    nutrition: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    confirmed: true,
  }]).map((f) => ({
    ...f,
    scanId: state.scanId,
    imageUrl: state.imageUrl ? `${BASE_URL}${state.imageUrl}` : undefined,
    // If food has top_k with multiple options, needs confirmation
    confirmed: !f.top_k || f.top_k.length <= 1,
  }));

  const [foods, setFoods] = useState<FoodItem[]>(initialFoods);
  const [amounts, setAmounts] = useState<string[]>(initialFoods.map(() => "100"));
  const [units, setUnits] = useState<string[]>(initialFoods.map(() => "g"));
  const [mealType, setMealType] = useState("meal");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Which item is showing the top-5 picker
  const [pickingIdx, setPickingIdx] = useState<number | null>(() => {
    const firstUnconfirmed = initialFoods.findIndex((f) => !f.confirmed);
    return firstUnconfirmed >= 0 ? firstUnconfirmed : null;
  });

  // Edit modal
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<FoodItem>(emptyFood());
  const [showEditDropdown, setShowEditDropdown] = useState(false);
  const editSearch = useNutritionSearch();

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addDraft, setAddDraft] = useState<FoodItem>(emptyFood());
  const [addAmount, setAddAmount] = useState("100");
  const [addUnit, setAddUnit] = useState("g");
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const addSearch = useNutritionSearch();

  // ── handlers ────────────────────────────────────────────────
  const handlePickerConfirm = async (
    idx: number,
    chosenLabel: string,
    isOther: boolean,
    customNutr?: FoodItem["nutrition"],
  ) => {
    const next = [...foods];
    const food = next[idx];

    if (isOther) {
      // Use custom nutrition if provided, else keep existing
      next[idx] = {
        ...food,
        name: chosenLabel,
        nutrition: customNutr ?? food.nutrition,
        confirmed: true,
      };
    } else {
      // Fetch nutrition for chosen label from our DB
      try {
        const res = await api.nutritionSearch(chosenLabel, 1);
        if (res.results.length > 0) {
          next[idx] = {
            ...food,
            name: chosenLabel,
            nutrition: nutritionFromResult(res.results[0].nutrition),
            confirmed: true,
          };
        } else {
          next[idx] = { ...food, name: chosenLabel, confirmed: true };
        }
      } catch {
        next[idx] = { ...food, name: chosenLabel, confirmed: true };
      }
    }

    setFoods(next);

    // Move to next unconfirmed item
    const nextUnconfirmed = next.findIndex((f, i) => i > idx && !f.confirmed);
    setPickingIdx(nextUnconfirmed >= 0 ? nextUnconfirmed : null);
  };

  const setAmount = (idx: number, v: string) => {
    const next = [...amounts]; next[idx] = v; setAmounts(next);
  };
  const setUnit = (idx: number, v: string) => {
    const next = [...units]; next[idx] = v; setUnits(next);
  };
  const startEdit = (idx: number) => {
    setEditDraft({ ...foods[idx] });
    setEditingIdx(idx);
    editSearch.clear();
    setShowEditDropdown(false);
  };
  const confirmEdit = () => {
    if (editingIdx === null) return;
    const next = [...foods]; next[editingIdx] = { ...editDraft, confirmed: true };
    setFoods(next);
    setEditingIdx(null);
    editSearch.clear();
  };
  const deleteItem = (idx: number) => {
    setFoods(foods.filter((_, i) => i !== idx));
    setAmounts(amounts.filter((_, i) => i !== idx));
    setUnits(units.filter((_, i) => i !== idx));
  };
  const confirmAdd = () => {
    if (!addDraft.name.trim()) return;
    setFoods([...foods, { ...addDraft, name: addDraft.name.trim(), confirmed: true }]);
    setAmounts([...amounts, addAmount]);
    setUnits([...units, addUnit]);
    setAddDraft(emptyFood());
    setAddAmount("100"); setAddUnit("g");
    setShowAdd(false); addSearch.clear();
  };

  // ── totals ──────────────────────────────────────────────────
  const totals = foods.reduce((acc, food, idx) => {
    const factor = toGrams(amounts[idx] ?? "100", units[idx] ?? "g") / 100;
    const n = food.nutrition;
    return {
      calories: acc.calories + (n?.kcal    ?? 0) * factor,
      protein:  acc.protein  + (n?.protein ?? 0) * factor,
      carbs:    acc.carbs    + (n?.carbs   ?? 0) * factor,
      fat:      acc.fat      + (n?.fat     ?? 0) * factor,
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const pieData = [
    { name: "Protein", value: Math.round(totals.protein), color: "#3B82F6" },
    { name: "Carbs",   value: Math.round(totals.carbs),   color: "#F59E0B" },
    { name: "Fat",     value: Math.round(totals.fat),     color: "#EF4444" },
  ].filter((d) => d.value > 0);

  // ── log ─────────────────────────────────────────────────────
  const handleLogMeal = async () => {
    setSaving(true); setError("");
    try {
      for (let i = 0; i < foods.length; i++) {
        const grams = toGrams(amounts[i] ?? "100", units[i] ?? "g");
        const factor = grams / 100;
        const n = foods[i].nutrition;
        await api.logMeal({
          food_name: foods[i].name, meal_type: mealType, quantity_g: grams,
          calories: (n?.kcal ?? 0) * factor, protein: (n?.protein ?? 0) * factor,
          carbs:    (n?.carbs ?? 0) * factor, fat:     (n?.fat ?? 0) * factor,
          scan_id: state.scanId, image_url: state.imageUrl ?? undefined,
        });
      }
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to log meal");
    } finally { setSaving(false); }
  };

  // ── subcomponents ────────────────────────────────────────────
  const SearchDropdown = ({ results, onSelect }: {
    results: ReturnType<typeof useNutritionSearch>["results"];
    onSelect: (item: typeof results[0]) => void;
  }) => (
    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
      {results.map((item) => (
        <button key={item.food} onClick={() => onSelect(item)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0">
          <div>
            <p className="text-sm font-medium text-gray-800 capitalize">{item.food.replace(/_/g, " ")}</p>
            <p className="text-xs text-gray-400">
              {item.nutrition.kcal_100g ?? "—"} kcal · {item.nutrition.protein_100g ?? "—"}g protein
            </p>
          </div>
          <span className="text-xs text-green-500 font-medium ml-2">{Math.round(item.score)}%</span>
        </button>
      ))}
    </div>
  );

  const NutrInput = ({ label, value, onChange, color }: {
    label: string; value: string; onChange: (v: string) => void; color: string;
  }) => (
    <div>
      <label className={`text-xs font-medium mb-1 block ${color}`}>{label}</label>
      <input type="number" min="0" placeholder="0" value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#22C55E]" />
    </div>
  );

  const allConfirmed = foods.every((f) => f.confirmed);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto">
      {/* Top-5 Picker Modal */}
      {pickingIdx !== null && foods[pickingIdx] && (
        <Top5Picker
          food={foods[pickingIdx]}
          onConfirm={(label, isOther, _, customNutr) =>
            handlePickerConfirm(pickingIdx, label, isOther, customNutr)
          }
          onClose={() => {
            // Mark as confirmed with original top-1
            const next = [...foods];
            next[pickingIdx] = { ...next[pickingIdx], confirmed: true };
            setFoods(next);
            const nextUnconfirmed = next.findIndex((f, i) => i > pickingIdx && !f.confirmed);
            setPickingIdx(nextUnconfirmed >= 0 ? nextUnconfirmed : null);
          }}
        />
      )}

      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/home")} className="w-10 h-10 flex items-center justify-center">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-semibold text-lg">Nutrition Results</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Food image */}
      {state.imageUrl && (
        <div className="px-6 mt-6">
          <img src={`${BASE_URL}${state.imageUrl}`} alt="Scanned food"
            className="w-full h-48 object-cover rounded-3xl shadow-sm border border-gray-100" />
        </div>
      )}

      {/* Unconfirmed banner */}
      {!allConfirmed && (
        <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-2">
          <span className="text-amber-500 text-lg">⚠️</span>
          <p className="text-sm text-amber-800 font-medium">
            Please confirm all food items before logging
          </p>
        </div>
      )}

      {/* Totals card */}
      <div className="px-6 mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900">Total Nutrition</h2>
            <div className="flex items-center gap-1 text-orange-500">
              <Flame size={18} />
              <span className="font-bold text-lg">{Math.round(totals.calories)}</span>
              <span className="text-sm text-gray-400">kcal</span>
            </div>
          </div>
          {pieData.length > 0 && (
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { label: "Protein", value: totals.protein, color: "text-blue-500" },
              { label: "Carbs",   value: totals.carbs,   color: "text-amber-500" },
              { label: "Fat",     value: totals.fat,     color: "text-red-500" },
            ].map((m) => (
              <div key={m.label} className="bg-gray-50 rounded-2xl p-3 text-center">
                <p className={`font-bold text-lg ${m.color}`}>{Math.round(m.value)}g</p>
                <p className="text-xs text-gray-500">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Food items */}
      <div className="px-6 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Food Items ({foods.length})</h3>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 bg-[#22C55E] text-white px-3 py-1.5 rounded-xl text-sm font-medium">
            <Plus size={15} /> Add Item
          </button>
        </div>

        <div className="space-y-3">
          {foods.map((food, idx) => {
            const grams  = toGrams(amounts[idx] ?? "100", units[idx] ?? "g");
            const factor = grams / 100;
            const kcal   = food.nutrition?.kcal != null ? Math.round(food.nutrition.kcal * factor) : null;

            return (
              <div key={idx} className={`bg-white rounded-3xl p-5 shadow-sm border-2 transition-all ${
                food.confirmed ? "border-gray-100" : "border-amber-300"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-semibold text-gray-900 capitalize truncate">{food.name}</p>
                    <p className="text-xs text-gray-400">{food.confidence}% confidence</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {kcal !== null && (
                      <div className="flex items-center gap-0.5 text-orange-500 mr-1">
                        <Flame size={13} />
                        <span className="text-sm font-semibold">{kcal}</span>
                      </div>
                    )}
                    {!food.confirmed && (
                      <button onClick={() => setPickingIdx(idx)}
                        className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-medium mr-1">
                        Confirm ✓
                      </button>
                    )}
                    <button onClick={() => startEdit(idx)}
                      className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center hover:bg-blue-100">
                      <Pencil size={14} className="text-blue-500" />
                    </button>
                    <button onClick={() => deleteItem(idx)}
                      className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center hover:bg-red-100">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 mb-1 block">Amount</label>
                    <input type="number" min="0" value={amounts[idx] ?? "100"}
                      onChange={(e) => setAmount(idx, e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-base font-semibold text-gray-800 focus:outline-none focus:border-[#22C55E]" />
                  </div>
                  <div className="w-28">
                    <label className="text-xs text-gray-400 mb-1 block">Unit</label>
                    <select value={units[idx] ?? "g"} onChange={(e) => setUnit(idx, e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#22C55E] bg-white">
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                {(units[idx] ?? "g") !== "g" && (
                  <p className="text-xs text-gray-400 mt-1.5">≈ {Math.round(grams)}g</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit modal */}
      {editingIdx !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center px-4 pb-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Edit Item</h3>
              <button onClick={() => { setEditingIdx(null); editSearch.clear(); }}
                className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="mb-4 relative">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Food Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                {editSearch.loading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={14} />
                )}
                <input type="text" value={editDraft.name}
                  onChange={(e) => {
                    setEditDraft({ ...editDraft, name: e.target.value });
                    editSearch.search(e.target.value);
                    setShowEditDropdown(true);
                  }}
                  className="w-full pl-9 pr-4 border-2 border-gray-200 rounded-xl py-3 text-gray-800 focus:outline-none focus:border-[#22C55E]" />
              </div>
              {showEditDropdown && editSearch.results.length > 0 && (
                <SearchDropdown results={editSearch.results} onSelect={(item) => {
                  setEditDraft({ ...editDraft, name: item.food.replace(/_/g, " "), nutrition: nutritionFromResult(item.nutrition) });
                  editSearch.clear(); setShowEditDropdown(false);
                }} />
              )}
            </div>
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Nutrition per 100g</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              <NutrInput label="Calories (kcal)" color="text-orange-500"
                value={editDraft.nutrition?.kcal?.toString() ?? ""}
                onChange={(v) => setEditDraft({ ...editDraft, nutrition: { ...editDraft.nutrition!, kcal: parseFloat(v) || null } })} />
              <NutrInput label="Protein (g)" color="text-blue-500"
                value={editDraft.nutrition?.protein?.toString() ?? ""}
                onChange={(v) => setEditDraft({ ...editDraft, nutrition: { ...editDraft.nutrition!, protein: parseFloat(v) || null } })} />
              <NutrInput label="Carbs (g)" color="text-amber-500"
                value={editDraft.nutrition?.carbs?.toString() ?? ""}
                onChange={(v) => setEditDraft({ ...editDraft, nutrition: { ...editDraft.nutrition!, carbs: parseFloat(v) || null } })} />
              <NutrInput label="Fat (g)" color="text-red-500"
                value={editDraft.nutrition?.fat?.toString() ?? ""}
                onChange={(v) => setEditDraft({ ...editDraft, nutrition: { ...editDraft.nutrition!, fat: parseFloat(v) || null } })} />
            </div>
            <button onClick={confirmEdit}
              className="w-full bg-[#22C55E] text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2">
              <Check size={18} /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center px-4 pb-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Add Food Item</h3>
              <button onClick={() => { setShowAdd(false); addSearch.clear(); }}
                className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="mb-3 relative">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Food Name *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                {addSearch.loading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={14} />
                )}
                <input type="text" placeholder="e.g. Chapati, Dal…" value={addDraft.name}
                  onChange={(e) => {
                    setAddDraft({ ...addDraft, name: e.target.value });
                    addSearch.search(e.target.value);
                    setShowAddDropdown(true);
                  }}
                  className="w-full pl-9 pr-4 border-2 border-gray-200 rounded-xl py-3 text-gray-800 focus:outline-none focus:border-[#22C55E]" />
              </div>
              {showAddDropdown && addSearch.results.length > 0 && (
                <SearchDropdown results={addSearch.results} onSelect={(item) => {
                  setAddDraft({ ...addDraft, name: item.food.replace(/_/g, " "), nutrition: nutritionFromResult(item.nutrition) });
                  addSearch.clear(); setShowAddDropdown(false);
                }} />
              )}
            </div>
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Amount</label>
                <input type="number" min="0" value={addAmount} onChange={(e) => setAddAmount(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#22C55E]" />
              </div>
              <div className="w-28">
                <label className="text-xs text-gray-400 mb-1 block">Unit</label>
                <select value={addUnit} onChange={(e) => setAddUnit(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#22C55E] bg-white">
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Nutrition per 100g</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              <NutrInput label="Calories (kcal)" color="text-orange-500"
                value={addDraft.nutrition?.kcal?.toString() ?? ""}
                onChange={(v) => setAddDraft({ ...addDraft, nutrition: { ...addDraft.nutrition!, kcal: parseFloat(v) || null } })} />
              <NutrInput label="Protein (g)" color="text-blue-500"
                value={addDraft.nutrition?.protein?.toString() ?? ""}
                onChange={(v) => setAddDraft({ ...addDraft, nutrition: { ...addDraft.nutrition!, protein: parseFloat(v) || null } })} />
              <NutrInput label="Carbs (g)" color="text-amber-500"
                value={addDraft.nutrition?.carbs?.toString() ?? ""}
                onChange={(v) => setAddDraft({ ...addDraft, nutrition: { ...addDraft.nutrition!, carbs: parseFloat(v) || null } })} />
              <NutrInput label="Fat (g)" color="text-red-500"
                value={addDraft.nutrition?.fat?.toString() ?? ""}
                onChange={(v) => setAddDraft({ ...addDraft, nutrition: { ...addDraft.nutrition!, fat: parseFloat(v) || null } })} />
            </div>
            <button onClick={confirmAdd} disabled={!addDraft.name.trim()}
              className="w-full bg-[#22C55E] text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
              <Plus size={18} /> Add to Meal
            </button>
          </div>
        </div>
      )}

      {/* Meal type */}
      <div className="px-6 mt-5">
        <label className="block text-sm text-gray-600 mb-2">Meal type</label>
        <div className="flex gap-2 flex-wrap">
          {["breakfast", "lunch", "dinner", "snack", "meal"].map((t) => (
            <button key={t} onClick={() => setMealType(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                mealType === t ? "bg-[#22C55E] text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Log button */}
      <div className="px-6 mt-6">
        {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
        {!allConfirmed && (
          <p className="text-amber-600 text-sm mb-3 text-center">
            ⚠️ Please confirm all items first
          </p>
        )}
        {saved ? (
          <div className="w-full bg-green-50 border border-green-200 rounded-2xl py-4 flex items-center justify-center gap-2">
            <CheckCircle className="text-[#22C55E]" size={22} />
            <span className="font-semibold text-[#22C55E]">Meal logged!</span>
          </div>
        ) : (
          <button onClick={handleLogMeal} disabled={saving || foods.length === 0 || !allConfirmed}
            className="w-full bg-[#22C55E] text-white py-4 rounded-2xl font-semibold shadow-lg shadow-[#22C55E]/30 flex items-center justify-center gap-2 disabled:opacity-60">
            <Save size={20} />
            {saving ? "Saving…" : `Log ${foods.length} Item${foods.length !== 1 ? "s" : ""}`}
          </button>
        )}
        <button onClick={() => navigate("/home")} className="w-full mt-3 text-gray-400 py-3 text-sm">
          Back to Dashboard
        </button>
      </div>

      <BottomNavigation />
    </div>
  );
}