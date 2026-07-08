"use client";

import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";

interface BlogSearchProps {
  defaultValue?: string;
}

export function BlogSearch({ defaultValue }: BlogSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = inputRef.current?.value ?? "";
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    params.delete("category");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSearch} className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="search"
        defaultValue={defaultValue}
        placeholder="Search articles…"
        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      )}
    </form>
  );
}
