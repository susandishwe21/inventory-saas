// Turn database errors into messages a user can understand
export function friendlyError(
  error: { code?: string; message: string },
  duplicateMessage = 'This already exists.',
): Error {
  if (error.code === '23505') return new Error(duplicateMessage); // unique constraint, e.g. same SKU twice
  if (error.code === '42501') return new Error("You don't have permission to make this change."); // RLS or column privileges
  return new Error(error.message);
}

// RLS doesn't report an error when it blocks an update or delete: it just changes 0 rows.
// Call this with the rows returned by .select() after update() / delete().
export function requireChanged(
  rows: unknown[] | null,
  message = 'Nothing was changed. Only the shop owner can do this, or it was already deleted.',
): void {
  if (!rows || rows.length === 0) throw new Error(message);
}
