type CoverPresentation = {
  alt: string;
  width: number;
  height: number;
  caption?: string;
  position?: string;
  credit?: { label: string; href: string };
};

const covers: Record<string, CoverPresentation> = {
  "products-2026-planpresso.webp": {
    alt: "Planpresso logo with a generated product planning workspace, PRD, and agent handoff pack",
    width: 1440,
    height: 810,
    caption:
      "AI-generated product visualization based on Planpresso's branding and planning workflow, not an application screenshot.",
    credit: { label: "Explore Planpresso", href: "https://planpresso.doniputra.com/" },
  },
  "products-2026-milc.webp": {
    alt: "milc logo and a generated desktop visualization of voice-powered text editing",
    width: 1440,
    height: 810,
    caption:
      "AI-generated product visualization using the milc logo and publicly described features, not an application screenshot.",
    credit: { label: "Explore milc", href: "https://milc.work/en" },
  },
  "products-2026-smartmatch.webp": {
    alt: "SmartMatch OCR logo and a generated document-to-verified-data workflow visualization",
    width: 1440,
    height: 810,
    caption:
      "AI-generated product visualization using the SmartMatch OCR logo and documented workflow, not an application screenshot.",
    credit: { label: "Explore SmartMatch OCR", href: "https://smartmatch.gloding.com/" },
  },
  "editorial-2026-inose-equipment.webp": {
    alt: "AI-generated reconstruction of the pink, blue, and burgundy i-Nose C-19 research instruments",
    width: 1440,
    height: 810,
    caption:
      "AI-generated reconstruction based on i-Nose C-19 reference photographs, not an archival photograph or evidence of clinical performance.",
    credit: {
      label: "Project reference: ITS News",
      href: "https://www.its.ac.id/news/en/its-develops-i-nose-c-19-covid-19-detector-through-underarm-sweat-odor/",
    },
  },
  "editorial-2026-inose-device.webp": {
    alt: "The real i-Nose C-19 prototype with touchscreen, sensor unit, and keyboard",
    width: 1280,
    height: 959,
    caption: "i-Nose C-19 research prototype, 2021.",
    credit: {
      label: "Photo: ITS News",
      href: "https://www.its.ac.id/news/en/its-develops-i-nose-c-19-covid-19-detector-through-underarm-sweat-odor/",
    },
  },
  "editorial-2026-kawaijuku-campus.webp": {
    alt: "Kawaijuku Nagoya campus building with the institution's Japanese signage",
    width: 1440,
    height: 1076,
    position: "center 20%",
    caption:
      "Kawaijuku Nagoya campus, photographed in 2011. Institutional context, not the PoC interface or deployment site.",
    credit: {
      label: "Photo: Umako / Wikimedia Commons (CC0)",
      href: "https://commons.wikimedia.org/wiki/File:Kawaijuku_Nagoya_Campus_110222.jpg",
    },
  },
};

export function projectCover(
  imageUrl: string | null | undefined,
  title: string,
): CoverPresentation {
  let filename = "";
  try {
    filename =
      new URL(imageUrl ?? "", "https://portfolio.invalid")
        .pathname.split("/")
        .at(-1) ?? "";
  } catch {
    // Custom admin URLs fall back to a neutral description without stale credits.
  }
  if (Object.hasOwn(covers, filename)) return covers[filename];
  const conceptual = ["drone", "learning-ai", "sensor-research"].some(
    (asset) => filename === `editorial-2026-${asset}.webp`,
  );
  return {
    alt: `${title} project visual`,
    width: 1440,
    height: 810,
    ...(conceptual ? { caption: "Conceptual project illustration." } : {}),
  };
}
