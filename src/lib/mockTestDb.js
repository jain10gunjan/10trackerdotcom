/**
 * Server-side mock_tests writes with optional column stripping (schema drift).
 */

export async function insertWithSchemaFallback(supabase, table, payload) {
  let lastError = null;
  let data = null;
  let cleanedPayload = { ...payload };

  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await supabase.from(table).insert(cleanedPayload).select().single();
    if (!result.error) {
      data = result.data;
      lastError = null;
      break;
    }

    lastError = result.error;

    if (lastError.code === 'PGRST204') {
      const match = /Could not find the '([^']+)' column/i.exec(lastError.message || '');
      const missingColumn = match?.[1];
      if (missingColumn && Object.prototype.hasOwnProperty.call(cleanedPayload, missingColumn)) {
        delete cleanedPayload[missingColumn];
        continue;
      }
    }

    break;
  }

  return { data, error: lastError };
}

/** Upsert with column stripping when DB schema is behind the app */
export async function upsertWithSchemaFallback(supabase, table, payload, onConflict = 'user_email') {
  let lastError = null;
  let data = null;
  let cleanedPayload = { ...payload };

  for (let attempt = 0; attempt < 8; attempt++) {
    const result = await supabase
      .from(table)
      .upsert(cleanedPayload, { onConflict })
      .select()
      .single();
    if (!result.error) {
      data = result.data;
      lastError = null;
      break;
    }

    lastError = result.error;

    if (lastError.code === 'PGRST204') {
      const match = /Could not find the '([^']+)' column/i.exec(lastError.message || '');
      const missingColumn = match?.[1];
      if (missingColumn && Object.prototype.hasOwnProperty.call(cleanedPayload, missingColumn)) {
        delete cleanedPayload[missingColumn];
        continue;
      }
    }

    break;
  }

  return { data, error: lastError };
}
