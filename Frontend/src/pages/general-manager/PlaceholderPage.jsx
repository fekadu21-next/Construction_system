import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function PlaceholderPage({ title }) {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6">
      <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{title}</h1>
      <div className={`rounded-lg shadow-sm border p-8 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Module Not Implemented Yet</h2>
          <p className={isDark ? "text-slate-400" : "text-gray-600"}>
            This module is currently under development. Please check back later for updates.
          </p>
        </div>
      </div>
    </div>
  );
}
