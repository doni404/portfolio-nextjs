"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";
import { ArrowDownWideNarrow } from "lucide-react";

export function AdminSortSelect({ value, options }: {
  value: string;
  options: { label: string; value: string; href: string }[];
}) {
  const router = useRouter();
  const id = useId();
  return (
    <label className="admin-sort" htmlFor={id}>
      <ArrowDownWideNarrow size={15} aria-hidden="true" />
      <span className="sr-only">Sort by</span>
      <select id={id} value={value} onChange={(event) => {
        const option = options.find((item) => item.value === event.target.value);
        if (option) router.push(option.href);
      }}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
