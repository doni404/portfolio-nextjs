import Link from "next/link";

export function AdminFilters({ options, label = "Filter by status" }: {
  options: { label: string; href: string; active: boolean }[];
  label?: string;
}) {
  return (
    <nav className="admin-filters" aria-label={label}>
      {options.map((option) => (
        <Link key={option.label} href={option.href} aria-current={option.active ? "page" : undefined}>
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
