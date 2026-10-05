export function generatedImageType(bytes?: Buffer) {
  if (!bytes) return null;
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP")
    return { extension: "webp", mime: "image/webp" } as const;
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return { extension: "png", mime: "image/png" } as const;
  return null;
}
