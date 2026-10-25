export default function PlaceholderPage({ title }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Module Not Implemented Yet</h2>
          <p className="text-gray-600">
            This module is currently under development. Please check back later for updates.
          </p>
        </div>
      </div>
    </div>
  );
}
