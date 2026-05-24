import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Camera, ScanLine } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";
import LoadingState from "../components/LoadingState";

export default function BarcodeScannerScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [productFound, setProductFound] = useState(false);
  const navigate = useNavigate();

  const handleScan = () => {
    setIsScanning(true);
    // Simulate barcode scan
    setTimeout(() => {
      setIsScanning(false);
      setProductFound(true);
    }, 2000);
  };

  const product = {
    name: "Nature's Path Organic Oats",
    brand: "Nature's Path",
    barcode: "058449881216",
    image: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400&h=400&fit=crop",
    servingSize: "40g",
    servings: "15",
    calories: 150,
    nutrition: [
      { label: "Total Fat", value: "3g", percentage: 4 },
      { label: "Saturated Fat", value: "0.5g", percentage: 3 },
      { label: "Cholesterol", value: "0mg", percentage: 0 },
      { label: "Sodium", value: "0mg", percentage: 0 },
      { label: "Total Carbohydrate", value: "27g", percentage: 10 },
      { label: "Dietary Fiber", value: "4g", percentage: 14 },
      { label: "Total Sugars", value: "1g", percentage: 0 },
      { label: "Protein", value: "5g", percentage: 10 },
    ],
    ingredients:
      "Organic whole grain oats, organic sugar, sea salt, organic barley malt extract",
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/home")}
            className="w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-semibold text-lg">Barcode Scanner</h1>
          <div className="w-10" />
        </div>
      </div>

      {!productFound ? (
        <>
          {/* Scan Area */}
          <div className="px-6 mt-6">
            <div className="bg-gray-900 rounded-3xl overflow-hidden h-96 relative">
              {/* Scanner Frame */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-40 border-4 border-[#22C55E] rounded-2xl relative">
                  {/* Scanning line animation */}
                  {isScanning && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#22C55E] animate-pulse"></div>
                  )}
                  {/* Corner markers */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-white"></div>
                </div>
              </div>

              {/* Instructions */}
              <div className="absolute bottom-8 left-0 right-0 text-center px-6">
                <ScanLine className="mx-auto mb-2 text-white" size={32} />
                <p className="text-white text-sm">
                  Align barcode within the frame
                </p>
              </div>
            </div>
          </div>

          {/* Instructions Card */}
          <div className="px-6 mt-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">How to scan</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#22C55E] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    1
                  </div>
                  <p className="text-sm text-gray-600 flex-1">
                    Hold your phone steady over the barcode
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#22C55E] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    2
                  </div>
                  <p className="text-sm text-gray-600 flex-1">
                    Make sure the barcode is well lit
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#22C55E] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    3
                  </div>
                  <p className="text-sm text-gray-600 flex-1">
                    Wait for automatic detection
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scan Button */}
          <div className="px-6 mt-6">
            {isScanning ? (
              <LoadingState message="Scanning barcode..." />
            ) : (
              <button
                onClick={handleScan}
                className="w-full bg-[#22C55E] text-white py-4 rounded-2xl font-semibold shadow-lg shadow-[#22C55E]/30 hover:bg-[#1ea34d] transition-colors flex items-center justify-center gap-2"
              >
                <Camera size={20} />
                Start Scanning
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Product Details */}
          <div className="px-6 mt-6">
            {/* Product Header */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-4">
              <div className="flex gap-4 mb-4">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-24 h-24 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{product.brand}</p>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    {product.name}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Barcode: {product.barcode}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-sm text-green-600">Serving Size</p>
                  <p className="font-semibold text-green-800">
                    {product.servingSize}
                  </p>
                </div>
                <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-sm text-blue-600">Calories</p>
                  <p className="font-semibold text-blue-800">
                    {product.calories}
                  </p>
                </div>
              </div>
            </div>

            {/* Nutrition Table */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Nutrition Facts
              </h3>
              <div className="border-t-4 border-black pt-2 mb-2">
                <p className="text-xs">
                  Serving Size {product.servingSize} ({product.servings}{" "}
                  servings per container)
                </p>
              </div>
              <div className="space-y-2">
                {product.nutrition.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-gray-100"
                  >
                    <span className="text-sm text-gray-700">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.value}</span>
                      {item.percentage > 0 && (
                        <span className="text-xs text-gray-500">
                          {item.percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Ingredients</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.ingredients}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 mb-6">
              <button className="w-full bg-[#22C55E] text-white py-4 rounded-2xl font-semibold shadow-lg shadow-[#22C55E]/30">
                Add to Meal Log
              </button>
              <button
                onClick={() => setProductFound(false)}
                className="w-full border-2 border-gray-200 text-gray-900 py-4 rounded-2xl font-semibold"
              >
                Scan Another
              </button>
            </div>
          </div>
        </>
      )}

      <BottomNavigation />
    </div>
  );
}
