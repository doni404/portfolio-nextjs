import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={cn("rounded-lg shadow-sm", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="brand-bg" x1="72" x2="440" y1="64" y2="448" gradientUnits="userSpaceOnUse">
          <stop stopColor="#07111f" />
          <stop offset="1" stopColor="#0f1b33" />
        </linearGradient>
        <linearGradient id="brand-mark" x1="132" x2="390" y1="132" y2="382" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00e5ff" />
          <stop offset=".48" stopColor="#2563eb" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#brand-bg)" />
      <path
        d="M139 132h118c76 0 123 46 123 121 0 77-48 127-123 127H139V132Zm76 68v112h39c35 0 55-21 55-58 0-34-20-54-55-54h-39Z"
        fill="url(#brand-mark)"
      />
      <path d="M139 132h116v68H139v-68Zm0 180h116v68H139v-68Z" fill="#07111f" />
      <path d="M176 166v180" stroke="url(#brand-mark)" strokeWidth="52" strokeLinecap="round" />
      <path
        d="M224 176h101c50 0 82 31 82 78 0 48-32 80-82 80h-66v52h-70V176h35Zm35 62v35h55c14 0 22-6 22-18 0-11-8-17-22-17h-55Z"
        fill="#e0f2fe"
      />
      <path
        d="M111 205H77m34 51H65m46 51H84"
        stroke="#38bdf8"
        strokeWidth="18"
        strokeLinecap="round"
      />
      <circle cx="72" cy="205" r="14" fill="#00e5ff" />
      <circle cx="59" cy="256" r="14" fill="#38bdf8" />
      <circle cx="78" cy="307" r="14" fill="#2563eb" />
    </svg>
  );
}
