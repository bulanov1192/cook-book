import type {
  RecipeStatus,
  ShoppingListStatus,
  ShoppingListVisibility,
} from "$lib/api/types";
import { getCurrentLocale, getDictionary } from "$lib/i18n";

export function formatMinutes(minutes: number | null): string {
  const dictionary = getDictionary();

  if (!minutes && minutes !== 0) {
    return dictionary.common.notSet;
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function formatDate(dateValue: string): string {
  const locale = getCurrentLocale() === "ru" ? "ru-RU" : "en-US";

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

export function formatRecipeStatus(status: RecipeStatus): string {
  const dictionary = getDictionary();

  if (status === "published") {
    return dictionary.recipes.status.published;
  }

  if (status === "private") {
    return dictionary.recipes.status.private;
  }

  if (status === "archived") {
    return dictionary.recipes.status.archived;
  }

  return dictionary.recipes.status.draft;
}

export function formatShoppingListStatus(status: ShoppingListStatus): string {
  const dictionary = getDictionary();
  return status === "active"
    ? dictionary.common.active
    : dictionary.common.archived;
}

export function formatShoppingListVisibility(
  visibility: ShoppingListVisibility,
): string {
  const dictionary = getDictionary();
  return visibility === "public"
    ? dictionary.common.public
    : dictionary.common.private;
}

export function formatIngredientLine(
  amount: number | null,
  unit: string | null,
  name: string,
): string {
  const amountPart = amount ? `${amount}` : "";
  const unitPart = unit ?? "";
  return [amountPart, unitPart, name].filter(Boolean).join(" ");
}
