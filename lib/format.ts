export function money(value: string | number | undefined) {
  return `৳${Number(value ?? 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
}
export function date(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
export function title(value?: string) {
  return (value || "CREATED")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
export function initials(value?: string) {
  return (value || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((piece) => piece[0])
    .join("")
    .toUpperCase();
}
