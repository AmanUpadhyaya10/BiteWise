import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Send, Sparkles, Loader2, Bot, User } from "lucide-react";
import BottomNavigation from "../components/BottomNavigation";
import { api, auth } from "../api";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "What should I eat to hit my protein goal today?",
  "How are my macros looking this week?",
  "Suggest a healthy Indian dinner for tonight",
  "Am I eating too many carbs?",
];

export default function AIChatScreen() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your personal nutrition AI. I can see your meal logs, goals and weekly trends. Ask me anything about your diet! 🥗",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load user context once
  useEffect(() => {
    if (!auth.isLoggedIn()) { navigate("/login"); return; }
    loadContext();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadContext = async () => {
    try {
      const [today, weekly, streak, goals] = await Promise.all([
        api.getToday(),
        api.getWeekly(),
        api.getStreak(),
        api.getGoals(),
      ]);
      const todayMeals = today.meals.map(m =>
        `${m.meal_type}: ${m.food_name} (${m.quantity_g}g, ${m.calories} kcal, P:${m.protein}g C:${m.carbs}g F:${m.fat}g)`
      ).join("\n");

      const weeklyAvgCal = weekly.length
        ? Math.round(weekly.reduce((s, d) => s + d.value, 0) / weekly.length)
        : 0;

      setContext(`
USER PROFILE:
- Name: ${auth.name()}
- Daily Goals: ${goals.calories} kcal, Protein: ${goals.protein}g, Carbs: ${goals.carbs}g, Fat: ${goals.fat}g, Fiber: ${goals.fiber}g
- Current Streak: ${streak.streak} days

TODAY'S INTAKE:
- Calories: ${today.totals.calories} / ${today.goals.calories} kcal
- Protein: ${today.totals.protein}g / ${today.goals.protein}g
- Carbs: ${today.totals.carbs}g / ${today.goals.carbs}g
- Fat: ${today.totals.fat}g / ${today.goals.fat}g
- Fiber: ${today.totals.fiber}g / ${today.goals.fiber}g

TODAY'S MEALS:
${todayMeals || "No meals logged yet today."}

WEEKLY AVERAGE: ${weeklyAvgCal} kcal/day
      `.trim());
    } catch (e) {
      setContext("User data unavailable.");
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content: text.trim() });

      const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:8000";
      const response = await fetch(`${BASE_URL}/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "ngrok-skip-browser-warning": "true",
          "x-user-id": auth.userId() ?? ""
        },
        body: JSON.stringify({
          system: `You are a friendly, knowledgeable nutrition assistant embedded in a food tracking app called FoodScan. 
You help users understand their eating habits and give practical, personalized advice.
Be concise, warm, and specific. Use the user's actual data below when answering.
Focus on Indian foods and Indian dietary context when relevant.
Never make up data — only use what's provided. Keep responses under 200 words.

${context}`,
          messages: history,
        }),
      });

      const data = await response.json();
      const reply = data.reply ?? "Sorry, I couldn't get a response. Try again!";
      setMessages(prev => [...prev, { role: "assistant", content: reply, timestamp: new Date() }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, something went wrong. Please check your connection and try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto flex flex-col pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 px-5 pt-12 pb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/home")}
            className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="text-white" size={18} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">Nutrition AI</h1>
              <p className="text-white/70 text-xs">Powered by Groq AI</p>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
              msg.role === "assistant" ? "bg-violet-100" : "bg-green-100"
            }`}>
              {msg.role === "assistant"
                ? <Bot size={14} className="text-violet-600" />
                : <User size={14} className="text-green-600" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#22C55E] text-white rounded-tr-sm"
                  : "bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100"
              }`}>
                {msg.content}
              </div>
              <span className="text-xs text-gray-400 px-1">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot size={14} className="text-violet-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 mb-2 font-medium">SUGGESTED</p>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => sendMessage(s)}
                className="text-left text-sm bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-gray-700 hover:border-violet-300 hover:bg-violet-50 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100 pt-3">
        <div className="flex gap-2 items-end bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your nutrition..."
            rows={1}
            className="flex-1 resize-none text-sm text-gray-800 focus:outline-none bg-transparent leading-relaxed max-h-24 py-1"
            style={{ minHeight: 28 }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity mb-0.5"
          >
            {loading ? <Loader2 size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Uses your real meal data & goals</p>
      </div>

      <BottomNavigation />
    </div>
  );
}