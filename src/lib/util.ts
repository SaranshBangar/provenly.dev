export function initialsOf(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColor(i: number): string {
  return ["#0E9F6E", "#2E6FE6", "#C79A3A", "#7c3aed", "#D4543B", "#0891b2"][i % 6];
}
