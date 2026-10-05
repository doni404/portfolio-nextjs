type HomepageItem = { id: string };
type LoadItems<T> = (params: Record<string, string>) => Promise<{ data: T[] } | null>;

export async function getHomepageItems<T extends HomepageItem>(
  load: LoadItems<T>,
  limit: number,
): Promise<T[]> {
  // Query featured items separately so older picks are not lost to pagination.
  const pageSize = String(limit);
  const featured = (await load({ featured: "true", pageSize }))?.data ?? [];
  if (featured.length >= limit) return featured.slice(0, limit);

  const recent = (await load({ pageSize }))?.data ?? [];
  const seen = new Set<string>();
  return [...featured, ...recent].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).slice(0, limit);
}
