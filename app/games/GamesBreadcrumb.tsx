import Link from "next/link";
import type { Crumb } from "@/lib/games";

export default function GamesBreadcrumb({
  items,
  tone = "site",
}: {
  items: readonly Crumb[];
  tone?: "site" | "game";
}) {
  const linkClass =
    tone === "game"
      ? "inline-flex min-h-11 items-center font-bold text-[#E0B44A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E0B44A]"
      : "inline-flex min-h-11 items-center font-bold text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
  const currentClass =
    tone === "game"
      ? "inline-flex min-h-11 items-center font-bold text-[#F6F0E4]"
      : "inline-flex min-h-11 items-center font-bold text-gray-900";
  const sepClass = tone === "game" ? "px-1 text-[#D5C7A8]" : "px-1 text-gray-300";

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center text-sm">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center">
            {index > 0 && (
              <span aria-hidden="true" className={sepClass}>
                /
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ) : (
              <span className={currentClass} aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
