import { useState } from "react";
import { useNavigate } from "react-router";
import { Camera, Mail, Lock, Chrome, UserPlus, Eye, EyeOff } from "lucide-react";
import { api, auth } from "../api";

export default function LoginScreen() {
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName]               = useState("");
  const [isRegister, setIsRegister]   = useState(false);
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (isRegister && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      let user;
      if (isRegister) {
        user = await api.register(email, password, name);
      } else {
        user = await api.login(email, password);
      }
      auth.save(user.user_id, user.name, user.email);
      navigate("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
      <div className="flex-1 flex flex-col justify-center px-6 py-12">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[#22C55E] rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-[#22C55E]/30">
            <Camera className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BitWise</h1>
          <p className="text-gray-500 mt-2">Bite smarter, live better</p>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(""); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              !isRegister ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(""); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              isRegister ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
            Create Account
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#22C55E] transition-colors text-gray-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#22C55E] transition-colors text-gray-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-[#22C55E] transition-colors text-gray-900"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password — only on register */}
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className={`w-full pl-12 pr-12 py-4 bg-gray-50 border-2 rounded-2xl focus:outline-none transition-colors text-gray-900 ${
                    confirmPassword && confirmPassword !== password
                      ? "border-red-300 focus:border-red-400"
                      : "border-gray-200 focus:border-[#22C55E]"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-red-500 text-xs mt-1 ml-1">Passwords do not match</p>
              )}
              {confirmPassword && confirmPassword === password && (
                <p className="text-green-500 text-xs mt-1 ml-1">✓ Passwords match</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22C55E] text-white py-4 rounded-2xl font-semibold shadow-lg shadow-[#22C55E]/30 hover:bg-[#1ea34d] transition-colors mt-2 disabled:opacity-60"
          >
            {loading ? "Please wait…" : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-gray-200 opacity-50 cursor-not-allowed"
        >
          <Chrome size={20} />
          <span className="font-semibold text-sm">Continue with Google (coming soon)</span>
        </button>
      </div>
    </div>
  );
}