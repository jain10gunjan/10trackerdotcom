"use client";

import { DEFAULT_CREATION_CONFIG } from "@/lib/mcqCreationApi";

export default function McqConfigForm({ config, onChange, disabled = false }) {
  const setField = (key, value) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">Category</span>
        <input
          type="text"
          value={config.category}
          disabled={disabled}
          onChange={(e) => setField("category", e.target.value)}
          placeholder={DEFAULT_CREATION_CONFIG.category}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">Subject</span>
        <input
          type="text"
          value={config.subject}
          disabled={disabled}
          onChange={(e) => setField("subject", e.target.value)}
          placeholder={DEFAULT_CREATION_CONFIG.subject}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">Chapter</span>
        <input
          type="text"
          value={config.chapter}
          disabled={disabled}
          onChange={(e) => setField("chapter", e.target.value)}
          placeholder={DEFAULT_CREATION_CONFIG.chapter}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">Default topic</span>
        <input
          type="text"
          value={config.default_topic}
          disabled={disabled}
          onChange={(e) => setField("default_topic", e.target.value)}
          placeholder="Same as chapter if empty"
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">ID prefix</span>
        <input
          type="text"
          value={config.id_prefix}
          disabled={disabled}
          onChange={(e) => setField("id_prefix", e.target.value)}
          placeholder={DEFAULT_CREATION_CONFIG.id_prefix}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">Start number</span>
        <input
          type="number"
          min={1}
          value={config.start_number}
          disabled={disabled}
          onChange={(e) =>
            setField("start_number", Math.max(1, Number(e.target.value) || 1))
          }
          className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-300"
        />
      </label>
    </div>
  );
}
