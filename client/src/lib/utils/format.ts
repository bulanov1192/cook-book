import type { RecipeStatus, ShoppingListStatus } from "$lib/api/types";

export function formatMinutes(minutes: number | null): string {
  if (!minutes && minutes !== 0) {
    return "Not set";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(dateValue));
}

export function formatRecipeStatus(status: RecipeStatus): string {
  if (status === "published") {
    return "Published";
  }

  if (status === "private") {
    return "Private";
  }

  if (status === "archived") {
    return "Archived";
  }

  return "Draft";
}

export function formatShoppingListStatus(status: ShoppingListStatus): string {
  return status === "active" ? "Active" : "Archived";
}

export function formatShoppingListVisibility(visibility: import("$lib/api/types").ShoppingListVisibility): string {
  return visibility === "public" ? "Public" : "Private";
}

export function formatIngredientLine(amount: number | null, unit: string | null, name: string): string {
  const amountPart = amount ? `${amount}` : "";
  const unitPart = unit ?? "";
  return [amountPart, unitPart, name].filter(Boolean).join(" ");
}
