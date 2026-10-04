import { cn } from "@/lib/utils";
import Image from "next/image";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/doni-portrait.png"
      width={64}
      height={64}
      alt=""
      aria-hidden="true"
      className={cn("brand-mark rounded-lg object-cover", className)}
    />
  );
}
