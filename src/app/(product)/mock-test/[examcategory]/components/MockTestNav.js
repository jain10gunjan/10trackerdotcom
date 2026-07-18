import Link from 'next/link';
import { BookOpen, BarChart3, PlayCircle } from "lucide-react";

export default function MockTestNav({ active }) {
  return (
    <nav className="flex gap-4 mb-6 items-center">
      <Link href="/gate-cse/mock-test">
        <span className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${active === 'tests' ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-blue-700'}`}>
          <BookOpen className="w-4 h-4" /> All Tests
        </span>
      </Link>
      <Link href="/gate-cse/mock-test/results">
        <span className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${active === 'results' ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-blue-700'}`}>
          <BarChart3 className="w-4 h-4" /> My Results
        </span>
      </Link>
      <Link href="/gate-cse/mock-test/attempt">
        <span className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition ${active === 'attempt' ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-blue-700'}`}>
          <PlayCircle className="w-4 h-4" /> Take Test
        </span>
      </Link>
    </nav>
  );
}
