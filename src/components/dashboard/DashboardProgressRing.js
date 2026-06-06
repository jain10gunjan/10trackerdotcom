'use client';

const R = 52;
const STROKE = 14;
const C = 2 * Math.PI * R;

function arcLength(fraction) {
  return Math.max(0, Math.min(1, fraction)) * C;
}

export default function DashboardProgressRing({
  practiceQuestions = 0,
  mocksCompleted = 0,
  practiceAccuracy = 0,
}) {
  const practice = Math.max(0, practiceQuestions);
  const mocks = Math.max(0, mocksCompleted);
  const total = practice + mocks;
  const hasAccuracy = practice > 0;

  const practiceFrac = total > 0 ? practice / total : 0;
  const mockFrac = total > 0 ? mocks / total : 0;

  const practiceLen = arcLength(practiceFrac);
  const mockLen = arcLength(mockFrac);
  const practiceOffset = 0;
  const mockOffset = practiceLen > 0 ? -practiceLen : 0;

  const empty = total === 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
      <div className="relative shrink-0">
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="#f5f5f5"
            strokeWidth={STROKE}
          />
          {!empty && practiceLen > 0 ? (
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke="#10b981"
              strokeWidth={STROKE}
              strokeDasharray={`${practiceLen} ${C - practiceLen}`}
              strokeDashoffset={practiceOffset}
              strokeLinecap="round"
            />
          ) : null}
          {!empty && mockLen > 0 ? (
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke="#6366f1"
              strokeWidth={STROKE}
              strokeDasharray={`${mockLen} ${C - mockLen}`}
              strokeDashoffset={mockOffset}
              strokeLinecap="round"
            />
          ) : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
          <span className="text-2xl sm:text-3xl font-bold text-neutral-900 tabular-nums leading-none">
            {practice.toLocaleString()}
          </span>
          <span className="text-[11px] text-neutral-500 mt-1 leading-tight">
            questions
            <br />
            practiced
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-3 w-full sm:w-auto">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Progress overview</p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Practice volume and mock tests completed — no total bank denominator.
          </p>
        </div>
        <ul className="space-y-2">
          <li className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-neutral-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              Practice questions
            </span>
            <span className="font-semibold tabular-nums text-neutral-900">
              {practice.toLocaleString()}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-neutral-700">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
              Mocks completed
            </span>
            <span className="font-semibold tabular-nums text-neutral-900">
              {mocks.toLocaleString()}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3 text-sm">
            <span className="text-neutral-700">Practice accuracy</span>
            <span className="font-semibold tabular-nums text-neutral-900">
              {hasAccuracy ? `${practiceAccuracy}%` : '—'}
            </span>
          </li>
        </ul>
        {empty ? (
          <p className="text-xs text-neutral-500">
            Start practicing or take a mock test to see your ring fill in.
          </p>
        ) : null}
      </div>
    </div>
  );
}
