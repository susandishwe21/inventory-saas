// Turn database errors into messages a user can understand
export function friendlyError(
  error: { code?: string; message: string },
  duplicateMessage = 'This already exists.',
): Error {
  if (error.code === '23505') return new Error(duplicateMessage); // unique constraint, e.g. same SKU twice
  if (error.code === '42501') return new Error("You don't have permission to make this change."); // RLS or column privileges
  return new Error(error.message);
}
