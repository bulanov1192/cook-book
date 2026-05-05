export type PaginationOptions = {
  limit: number;
  offset: number;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export function normalizePagination(limit?: number, offset?: number): PaginationOptions {
  const normalizedLimit =
    typeof limit === "number" && Number.isFinite(limit)
      ? Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

  const normalizedOffset =
    typeof offset === "number" && Number.isFinite(offset)
      ? Math.max(Math.trunc(offset), 0)
      : 0;

  return {
    limit: normalizedLimit,
    offset: normalizedOffset
  };
}
