import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Camera, X, CheckCircle, ScanBarcode, Image as ImageIcon,
  Utensils, LayoutGrid, PenLine, Search, Plus, Loader2
} from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";
import { api } from "../api";

interface TopKItem { label: string; confidence: number; }

interface DetectedFood {
  name: string;
  portion: string;
  confidence: number;
  nutrition: { kcal: number | null; protein: number | null; carbs: number | null; fat: number | null } | null;
  top_k?: TopKItem[];
}

type Tab = "scan" | "manual";

export default function FoodScanScreen() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const barcodeFileRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tab, setTab] = useState<Tab>("scan");
  const [foodMode, setFoodMode] = useState<"single" | "multi">("single");
  const [inputMode, setInputMode] = useState<"camera" | "barcode" | "gallery">("camera");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);
  const [scanId, setScanId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  const [manualName, setManualName] = useState("");
  const [manualKcal, setManualKcal] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ food: string; score: number; nutrition: Record<string, number> }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleNameChange = (val: string) => {
    setManualName(val);
    setShowDropdown(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (val.trim().length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.nutritionSearch(val.trim());
        setSearchResults(res.results);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 350);
  };

  const selectFood = (item: { food: string; nutrition: Record<string, number> }) => {
    const n = item.nutrition;
    setManualName(item.food.replace(/_/g, " "));
    setManualKcal(String(n.kcal_100g ?? n.kcal ?? n.calories ?? ""));
    setManualProtein(String(n.protein_100g ?? n.protein ?? ""));
    setManualCarbs(String(n.carbs_100g ?? n.carbs ?? n.carbohydrates ?? ""));
    setManualFat(String(n.fat_100g ?? n.fat ?? ""));
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleBarcodeCamera = () => {
    setShowBarcodeModal(true);
    setTimeout(() => {
      if (barcodeFileRef.current) {
        barcodeFileRef.current.capture = "environment";
        barcodeFileRef.current.click();
      }
    }, 100);
  };

  const handleBarcodeGallery = () => {
    setShowBarcodeModal(true);
    setTimeout(() => {
      if (barcodeFileRef.current) {
        barcodeFileRef.current.capture = "" as any;
        barcodeFileRef.current.click();
      }
    }, 100);
  };

  const scanBarcode = async (file: File) => {
    setIsScanning(true);
    setScanProgress(0);
    setError("");
    const ticker = setInterval(() => setScanProgress((p) => Math.min(p + 10, 85)), 300);

    try {
      const barcodeRes = await api.scanBarcodeImage(file);

      if (barcodeRes.error || !barcodeRes.barcode) {
        throw new Error(barcodeRes.error ?? "Barcode not detected. Try a clearer image.");
      }

      console.log("Barcode detected:", barcodeRes.barcode);

      const product = await api.lookupBarcode(barcodeRes.barcode);

      if (product.not_found || product.error) {
        throw new Error("Product not found in database. Try manual entry.");
      }

      setDetectedFoods([{
        name: `${product.brand ? product.brand + " - " : ""}${product.name}`,
        portion: product.serving_grams ? `${product.serving_grams}g` : "100g",
        confidence: 100,
        nutrition: { kcal: product.calories, protein: product.protein, carbs: product.carbs, fat: product.fat },
      }]);

      setShowBarcodeModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Barcode scanning failed");
      console.error(err);
    } finally {
      clearInterval(ticker);
      setScanProgress(100);
      setIsScanning(false);
    }
  };

  const handleBarcodeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await scanBarcode(file);
    }
    e.target.value = "";
  };

  const runScan = async (file: File) => {
    setIsScanning(true);
    setScanProgress(0);
    setError("");
    setDetectedFoods([]);
    const ticker = setInterval(() => setScanProgress((p) => Math.min(p + 8, 90)), 200);

    try {
      const result = await api.predict(file, foodMode);
      setScanId(result.scan_id);
      setImageUrl(result.image_url);

      if (result.mode === "single") {
        const top1 = result.top_k[0];
        setDetectedFoods([{
          name: top1.label,
          portion: "100g",
          confidence: Math.round(top1.confidence * 100),
          nutrition: result.nutrition,
          top_k: result.top_k,
        }]);
      } else if (result.mode === "multi" && result.items) {
        setDetectedFoods(result.items.map((item) => ({
          name: item.top_k[0]?.label ?? "Unknown",
          portion: "100g",
          confidence: Math.round((item.top_k[0]?.confidence ?? 0) * 100),
          nutrition: item.nutrition,
          top_k: item.top_k,
        })));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Scan failed. Try again.");
    } finally {
      clearInterval(ticker);
      setScanProgress(100);
      setIsScanning(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await runScan(file);
    e.target.value = "";
  };

  const handleContinue = () => {
    navigate("/result", { state: { scanId, imageUrl, foods: detectedFoods } });
  };

  const handleManualAdd = () => {
    if (!manualName.trim()) return;
    navigate("/result", {
      state: {
        foods: [{
          name: manualName.trim(), portion: "100g", confidence: 100,
          nutrition: {
            kcal:    parseFloat(manualKcal)    || null,
            protein: parseFloat(manualProtein) || null,
            carbs:   parseFloat(manualCarbs)   || null,
            fat:     parseFloat(manualFat)     || null,
          },
        }],
      },
    });
  };

  const accentColor = foodMode === "multi" ? "#F97316" : "#22C55E";

  return (
    <div className="min-h-screen bg-gray-900 max-w-md mx-auto flex flex-col pb-20">
      <input ref={fileRef} type="file" accept="image/*"
        capture={inputMode === "camera" ? "environment" : undefined}
        className="hidden" onChange={handleFileChange} />

      <input ref={barcodeFileRef} type="file" accept="image/*"
        className="hidden" onChange={handleBarcodeFileChange} />

      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button onClick={() => navigate("/home")}
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
          <X className="text-white" size={20} />
        </button>
        <h1 className="text-white font-semibold text-base">Food Scanner</h1>
        <div className="w-10" />
      </div>

      <div className="mx-5 flex bg-white/10 rounded-2xl p-1 mb-4">
        <button onClick={() => setTab("scan")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "scan" ? "bg-white text-gray-900" : "text-white/60"}`}>
          <Camera size={16} /> Scan
        </button>
        <button onClick={() => setTab("manual")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === "manual" ? "bg-white text-gray-900" : "text-white/60"}`}>
          <PenLine size={16} /> Manual Entry
        </button>
      </div>

      {tab === "scan" && (
        <div className="flex-1 flex flex-col px-5">
          {!detectedFoods.length && !isScanning && (
            <div className="flex gap-3 mb-5">
              <button onClick={() => setFoodMode("single")}
                className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all ${
                  foodMode === "single" ? "border-[#22C55E] bg-[#22C55E]/15" : "border-white/15 bg-white/5"}`}>
                <Utensils size={22} className={foodMode === "single" ? "text-[#22C55E]" : "text-white/40"} />
                <span className={`text-sm font-bold ${foodMode === "single" ? "text-[#22C55E]" : "text-white/50"}`}>Single Food</span>
                <span className="text-white/30 text-xs">One dish / item</span>
              </button>
              <button onClick={() => setFoodMode("multi")}
                className={`flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl border-2 transition-all ${
                  foodMode === "multi" ? "border-orange-400 bg-orange-400/15" : "border-white/15 bg-white/5"}`}>
                <LayoutGrid size={22} className={foodMode === "multi" ? "text-orange-400" : "text-white/40"} />
                <span className={`text-sm font-bold ${foodMode === "multi" ? "text-orange-400" : "text-white/50"}`}>Multiple Foods</span>
                <span className="text-white/30 text-xs">Thali / full plate</span>
              </button>
            </div>
          )}

          {!detectedFoods.length && (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-xs rounded-3xl border-2 flex items-center justify-center relative transition-all duration-300"
                style={{ aspectRatio: "1", borderColor: isScanning ? accentColor : "rgba(255,255,255,0.15)",
                  boxShadow: isScanning ? `0 0 30px ${accentColor}40` : "none" }}>
                {["top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl",
                  "top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl",
                  "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl",
                  "bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl",
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-7 h-7 ${cls}`} style={{ borderColor: accentColor }} />
                ))}
                {isScanning ? (
                  <div className="text-center px-6">
                    <div className="w-12 h-12 mx-auto border-4 border-t-transparent rounded-full animate-spin mb-3"
                      style={{ borderColor: accentColor, borderTopColor: "transparent" }} />
                    <p className="text-white text-sm font-medium">
                      {foodMode === "multi" ? "Detecting all items…" : "Identifying food…"}
                    </p>
                    <div className="w-48 h-1 bg-white/10 rounded-full mt-3 overflow-hidden mx-auto">
                      <div className="h-full rounded-full transition-all duration-200"
                        style={{ width: `${scanProgress}%`, backgroundColor: accentColor }} />
                    </div>
                  </div>
                ) : (
                  <p className="text-white/30 text-sm text-center px-8">
                    {foodMode === "multi" ? "📸 Capture your full plate or thali" : "📸 Point at your food item"}
                  </p>
                )}
              </div>
            </div>
          )}

          {error && !isScanning && (
            <div className="bg-red-900/40 border border-red-500/30 rounded-2xl px-4 py-3 mb-4">
              <p className="text-red-300 text-sm text-center">{error}</p>
            </div>
          )}

          {detectedFoods.length > 0 && (
            <div className="flex-1 flex flex-col">
              <div className="bg-white rounded-3xl p-5 shadow-2xl overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="text-[#22C55E]" size={22} />
                  <h3 className="font-semibold text-gray-900">
                    {detectedFoods.length} item{detectedFoods.length > 1 ? "s" : ""} detected
                  </h3>
                </div>
                <div className="space-y-2 mb-5">
                  {detectedFoods.map((food, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: idx === 0 ? "#22C55E" : "#F97316" }} />
                        <div>
                          <p className="font-medium text-gray-900 capitalize text-sm">{food.name}</p>
                          <p className="text-xs text-gray-400">
                            {food.nutrition?.kcal != null ? `~${Math.round(food.nutrition.kcal)} kcal/${food.portion}` : "—"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{food.confidence}%</span>
                    </div>
                  ))}
                </div>
                <button onClick={handleContinue}
                  className="w-full bg-[#22C55E] text-white py-4 rounded-2xl font-semibold shadow-lg shadow-[#22C55E]/30">
                  View Nutrition & Log Meal
                </button>
                <button onClick={() => { setDetectedFoods([]); setError(""); }}
                  className="w-full mt-2 text-gray-400 py-2 text-sm">
                  Scan Again
                </button>
              </div>
            </div>
          )}

          {!detectedFoods.length && (
            <div className="flex flex-col items-center gap-4 py-5">
              <button
                onClick={() => {
                  if (inputMode === "barcode") {
                    setShowBarcodeModal(true);
                  } else {
                    fileRef.current?.click();
                  }
                }}
                disabled={isScanning}
                style={{ width: 72, height: 72, backgroundColor: "white" }}
                className="rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform disabled:opacity-50">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                  {inputMode === "barcode" ? <ScanBarcode className="text-white" size={28} />
                    : inputMode === "gallery" ? <ImageIcon className="text-white" size={28} />
                    : <Camera className="text-white" size={28} />}
                </div>
              </button>
              <div className="flex gap-2 bg-white/10 rounded-2xl p-1.5">
                {(["camera", "barcode", "gallery"] as const).map((m) => (
                  <button key={m} onClick={() => setInputMode(m)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-xs font-medium ${
                      inputMode === m ? "bg-white/20 text-white" : "text-white/40"}`}>
                    {m === "camera" && <Camera size={14} />}
                    {m === "barcode" && <ScanBarcode size={14} />}
                    {m === "gallery" && <ImageIcon size={14} />}
                    <span className="capitalize">{m}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Barcode Modal */}
      {showBarcodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-gray-900 rounded-t-3xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Scan Barcode</h3>
              <button
                onClick={() => setShowBarcodeModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleBarcodeCamera}
                disabled={isScanning}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2"
              >
                📷 {isScanning ? "Scanning..." : "Use Camera"}
              </button>

              <button
                onClick={handleBarcodeGallery}
                disabled={isScanning}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2"
              >
                🖼️ {isScanning ? "Scanning..." : "Upload from Gallery"}
              </button>

              <button
                onClick={() => setShowBarcodeModal(false)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-2xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "manual" && (
        <div className="flex-1 px-5 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 shadow-xl">
            <h2 className="font-bold text-gray-900 text-lg mb-1">Add Food Manually</h2>
            <p className="text-gray-400 text-sm mb-5">Search for a food to auto-fill nutrition, or enter values manually.</p>
            <div className="mb-4 relative">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Food Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={16} />
                )}
                <input type="text" placeholder="e.g. Dal Makhani, Apple, Biryani…"
                  value={manualName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                  className="w-full pl-10 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl text-gray-800 focus:outline-none focus:border-[#22C55E] transition-colors" />
              </div>
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                  {searchResults.map((item) => (
                    <button key={item.food} onClick={() => selectFood(item)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800 capitalize">{item.food.replace(/_/g, " ")}</p>
                        <p className="text-xs text-gray-400">
                          {item.nutrition.kcal_100g ?? item.nutrition.kcal ?? "—"} kcal · {item.nutrition.protein_100g ?? item.nutrition.protein ?? "—"}g protein
                        </p>
                      </div>
                      <span className="text-xs text-green-500 font-medium">{Math.round(item.score)}%</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-medium">Nutrition per 100g</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: "Calories (kcal)", value: manualKcal, set: setManualKcal, color: "border-orange-200 focus:border-orange-400" },
                { label: "Protein (g)",     value: manualProtein, set: setManualProtein, color: "border-blue-200 focus:border-blue-400" },
                { label: "Carbs (g)",       value: manualCarbs, set: setManualCarbs, color: "border-amber-200 focus:border-amber-400" },
                { label: "Fat (g)",         value: manualFat, set: setManualFat, color: "border-red-200 focus:border-red-400" },
              ].map(({ label, value, set, color }) => (
                <div key={label}>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
                  <input type="number" min="0" placeholder="0" value={value}
                    onChange={(e) => set(e.target.value)}
                    className={`w-full border-2 ${color} rounded-xl px-3 py-2.5 text-gray-800 focus:outline-none transition-colors text-sm`} />
                </div>
              ))}
            </div>
            <button onClick={handleManualAdd} disabled={!manualName.trim()}
              className="w-full bg-[#22C55E] text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#22C55E]/30 disabled:opacity-40">
              <Plus size={20} /> Continue to Log Meal
            </button>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}