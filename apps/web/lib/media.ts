export function mediaUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  const publicApi = (
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
  ).replace(/\/$/, "");
  let uploadPath = value.startsWith("/uploads/") ? value : undefined;
  if (!uploadPath) {
    try {
      const url = new URL(value);
      const apiOrigin = new URL(
        process.env.API_URL ?? "http://localhost:4000",
      ).origin;
      const isApi =
        url.origin === apiOrigin || url.origin === new URL(publicApi).origin;
      const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
      if (
        /^https?:$/.test(url.protocol) &&
        url.pathname.startsWith("/uploads/") &&
        (isApi || isLocal)
      )
        uploadPath = `${url.pathname}${url.search}${url.hash}`;
    } catch {
      // Keep non-upload and external CDN URLs as supplied.
    }
  }
  return uploadPath ? `${publicApi}${uploadPath}` : value;
}
