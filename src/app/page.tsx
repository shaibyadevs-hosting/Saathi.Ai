// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-900">Saathi.ai</h1>
        <p className="text-lg text-gray-700">
          Your Legal Practice Partner - Private AI assistant for Supreme Court
          practice
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/matters"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition"
          >
            View Matters
          </Link>
        </div>
      </div>
    </div>
  );
}
