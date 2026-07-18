'use client';

export default function CategoryManager({
  categories,
  onCreateCategory,
  onDeleteCategory,
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Manage Categories</h2>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const name = form.name.value.trim();
          const slug = form.slug.value.trim();
          const color = form.color.value.trim() || '#3B82F6';
          if (!name) return;
          try {
            const result = await onCreateCategory({ name, slug, color });
            if (result?.success) {
              form.reset();
            }
          } catch (err) {
            console.error(err);
          }
        }}
        className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6"
      >
        <input name="name" placeholder="Category name" className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 md:col-span-2" />
        <input name="slug" placeholder="slug (optional)" className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800" />
        <input name="color" placeholder="#3B82F6" className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800" />
        <button type="submit" className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700">Add</button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Slug</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Color</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {categories && Array.isArray(categories) && categories.map((cat) => (
              <tr key={cat.slug}>
                <td className="px-4 py-2 text-sm text-neutral-800">{cat.name}</td>
                <td className="px-4 py-2 text-sm text-neutral-500">{cat.slug}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                    <span className="text-neutral-600">{cat.color}</span>
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => onDeleteCategory(cat)}
                    className="px-3 py-1 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
