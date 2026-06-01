import { createBrowserRouter } from "react-router";
import RootScreen from "./screens/RootScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import LoginScreen from "./screens/LoginScreen";
import HomeDashboard from "./screens/HomeDashboard";
import FoodScanScreen from "./screens/FoodScanScreen";
import NutritionResultScreen from "./screens/NutritionResultScreen";
import MealHistoryScreen from "./screens/MealHistoryScreen";
import FoodDetailsScreen from "./screens/FoodDetailsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MealTimelineScreen from "./screens/MealTimelineScreen";
import NutritionInsightsScreen from "./screens/NutritionInsightsScreen";
import BarcodeScannerScreen from "./screens/BarcodeScannerScreen";
import HealthGoalsScreen from "./screens/HealthGoalsScreen";
import RecipesScreen from "./screens/RecipesScreen";
import FoodComparisonScreen from "./screens/FoodComparisonScreen";
import AchievementsScreen from "./screens/AchievementsScreen";
import CalendarDemoScreen from "./screens/CalendarDemoScreen";
import WeeklyReportScreen from "./screens/WeeklyReportScreen";
import AIChatScreen from "./screens/AIChatScreen";
import ModeratorScreen from "./screens/ModeratorScreen";

export const router = createBrowserRouter([
  { path: "/", Component: RootScreen },
  { path: "/welcome", Component: WelcomeScreen },
  { path: "/onboarding", Component: OnboardingScreen },
  { path: "/login", Component: LoginScreen },
  { path: "/home", Component: HomeDashboard },
  { path: "/scan", Component: FoodScanScreen },
  { path: "/result", Component: NutritionResultScreen },
  { path: "/history", Component: MealHistoryScreen },
  { path: "/food-details", Component: FoodDetailsScreen },
  { path: "/profile", Component: ProfileScreen },
  { path: "/timeline", Component: MealTimelineScreen },
  { path: "/insights", Component: NutritionInsightsScreen },
  { path: "/barcode", Component: BarcodeScannerScreen },
  { path: "/goals", Component: HealthGoalsScreen },
  { path: "/recipes", Component: RecipesScreen },
  { path: "/compare", Component: FoodComparisonScreen },
  { path: "/achievements", Component: AchievementsScreen },
  { path: "/calendar-demo", Component: CalendarDemoScreen },
  { path: "/weekly-report", Component: WeeklyReportScreen },
  { path: "/chat", Component: AIChatScreen },
  { path: "/moderator", Component: ModeratorScreen },
]);