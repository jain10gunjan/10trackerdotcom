/**
 * Build printable / downloadable checklist text for an OG path.
 */

function typeLabel(type) {
  if (type === 'VIDEO') return 'Video';
  if (type === 'PRACTICE_CHAPTER') return 'Practice';
  if (type === 'MOCK_TEST') return 'Mock';
  if (type === 'LEETCODE_PROBLEM') return 'LeetCode';
  if (type === 'CODESTUDIO_PROBLEM') return 'CodeStudio';
  if (type === 'HACKERRANK_PROBLEM') return 'HackerRank';
  return type || 'Step';
}

function statusMark(status) {
  if (status === 'COMPLETED') return '[x]';
  if (status === 'IN_PROGRESS') return '[~]';
  return '[ ]';
}

export function buildChecklistMarkdown(path, resources) {
  const lines = [
    `# ${path?.title || 'Study path'}`,
    '',
    path?.description ? `${path.description}` : '',
    path?.description ? '' : null,
    `Progress: ${path?.completedResources || 0}/${path?.totalResources || 0} (${path?.percent || 0}%)`,
    '',
  ].filter((x) => x != null);

  let currentSection = null;
  (resources || []).forEach((r, idx) => {
    const section = (r.sectionLabel || '').trim() || 'Path';
    if (section !== currentSection) {
      currentSection = section;
      lines.push(`## ${section}`, '');
    }
    const pct =
      r.progress?.percentWatched != null ? ` · ${r.progress.percentWatched}%` : '';
    lines.push(
      `${statusMark(r.progress?.status)} ${String(idx + 1).padStart(2, '0')}. (${typeLabel(r.type)}) ${r.title}${pct}`
    );
  });

  lines.push('', `_Exported from 10Tracker OG Trackers_`);
  return lines.join('\n');
}

export function downloadChecklistMarkdown(path, resources) {
  const md = buildChecklistMarkdown(path, resources);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${path?.slug || 'og-path'}-checklist.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function printChecklist(path, resources) {
  const md = buildChecklistMarkdown(path, resources);
  const html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^\[x\] (.*)$/gm, '<div class="done">☑ $1</div>')
    .replace(/^\[~\] (.*)$/gm, '<div class="prog">▣ $1</div>')
    .replace(/^\[ \] (.*)$/gm, '<div>□ $1</div>')
    .replace(/\n/g, '<br/>');

  const w = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900');
  if (!w) return false;
  w.document.write(`<!doctype html><html><head><title>${path?.title || 'Checklist'}</title>
    <style>
      body{font-family:Georgia,serif;padding:32px;color:#111;line-height:1.45}
      h1{font-size:22px;margin:0 0 8px} h2{font-size:15px;margin:22px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
      .done{color:#047857} .prog{color:#b45309}
      @media print{body{padding:0}}
    </style></head><body>${html}
    <script>window.onload=()=>{window.print()}</script></body></html>`);
  w.document.close();
  return true;
}
