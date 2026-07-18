'use client';

import { memo, useState, useCallback } from 'react';
import { Download, Loader2, ExternalLink, ClipboardPaste, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { isGateCategory } from '@/lib/gateCategory';
import { normalizeGateOverflowUrl } from '@/lib/gateoverflowUrl';

function GateSolutionFields({
  category,
  solution = '',
  solutiontext = '',
  questionId,
  onChange,
  urlClassName = '',
  textClassName = '',
}) {
  const [extracting, setExtracting] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pastedHtml, setPastedHtml] = useState('');

  const showGateFields = isGateCategory(category);

  const setSolution = useCallback(
    (value) => onChange?.({ solution: value, solutiontext }),
    [onChange, solutiontext]
  );

  const setSolutiontext = useCallback(
    (value) => onChange?.({ solution, solutiontext: value }),
    [onChange, solution]
  );

  const runExtract = useCallback(
    async (htmlOverride = null) => {
      const url = normalizeGateOverflowUrl(solution);
      if (!url) {
        toast.error('Paste a valid gateoverflow.in discussion URL first.');
        return;
      }

      if (solutiontext?.trim() && !htmlOverride) {
        const ok = window.confirm(
          'Solution text already has content. Replace it with the extracted GateOverflow solution?'
        );
        if (!ok) return;
      }

      setExtracting(true);
      try {
        const res = await fetch('/api/admin/extract-gate-solution', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: solution.trim(),
            questionId,
            ...(htmlOverride ? { html: htmlOverride } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Extraction failed');
        }
        onChange?.({
          solution: data.solution,
          solutiontext: data.solutiontext,
        });
        toast.success(
          htmlOverride
            ? 'Solution parsed from pasted HTML.'
            : 'Solution extracted from GateOverflow.'
        );
        if (htmlOverride) {
          setPastedHtml('');
          setPasteOpen(false);
        }
      } catch (err) {
        const msg = err?.message || 'Failed to extract solution.';
        toast.error(msg, { duration: 8000 });
        if (msg.includes('Cloudflare') || msg.includes('403')) {
          setPasteOpen(true);
        }
      } finally {
        setExtracting(false);
      }
    },
    [solution, solutiontext, questionId, onChange]
  );

  const handleExtract = useCallback(() => runExtract(null), [runExtract]);

  const handleParsePasted = useCallback(() => {
    if (!pastedHtml.trim()) {
      toast.error('Paste the answer HTML from GateOverflow first.');
      return;
    }
    runExtract(pastedHtml.trim());
  }, [pastedHtml, runExtract]);

  if (!showGateFields) {
    return (
      <div>
        <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wide">
          Solution
        </label>
        <textarea
          value={solutiontext || solution || ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange?.({ solution: v, solutiontext: v });
          }}
          className={textClassName || 'w-full p-3 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20'}
          rows={4}
          placeholder="Solution"
        />
      </div>
    );
  }

  const normalizedUrl = normalizeGateOverflowUrl(solution);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wide">
          Discussion URL (GateOverflow)
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={solution || ''}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="https://gateoverflow.in/3286/gate2008-it-25"
            className={
              urlClassName ||
              'flex-1 p-3 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm'
            }
          />
          {normalizedUrl ? (
            <a
              href={normalizedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shrink-0"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExtract}
          disabled={extracting || !solution?.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {extracting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {extracting ? 'Extracting…' : 'Extract solution'}
        </button>
        <p className="text-xs text-neutral-500">
          Auto-fetch may be blocked by Cloudflare — use paste fallback below if needed.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50/80">
        <button
          type="button"
          onClick={() => setPasteOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-neutral-700"
        >
          <span className="inline-flex items-center gap-2">
            <ClipboardPaste className="h-4 w-4" />
            Paste HTML fallback (when auto-extract fails)
          </span>
          {pasteOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {pasteOpen && (
          <div className="px-3 pb-3 space-y-2 border-t border-neutral-200">
            <p className="text-xs text-neutral-600 pt-2">
              Open the discussion in your browser → right-click the answer → Inspect → copy the
              <code className="mx-1 px-1 bg-white rounded">.qa-a-item-content</code> inner HTML → paste below → Parse.
            </p>
            <textarea
              value={pastedHtml}
              onChange={(e) => setPastedHtml(e.target.value)}
              rows={5}
              className="w-full p-2 border border-neutral-200 rounded-lg font-mono text-xs bg-white"
              placeholder="Paste answer HTML here…"
            />
            <button
              type="button"
              onClick={handleParsePasted}
              disabled={extracting || !pastedHtml.trim() || !solution?.trim()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-neutral-300 text-sm font-medium hover:bg-neutral-100 disabled:opacity-50"
            >
              {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardPaste className="h-4 w-4" />}
              Parse pasted HTML
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase tracking-wide">
          Solution text (HTML)
        </label>
        <textarea
          value={solutiontext || ''}
          onChange={(e) => setSolutiontext(e.target.value)}
          className={
            textClassName ||
            'w-full p-3 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-xs'
          }
          rows={8}
          placeholder="Extracted explanation appears here. Students see this inline; the URL above is the discussion link."
        />
      </div>
    </div>
  );
}

export default memo(GateSolutionFields);
