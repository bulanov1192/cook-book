import type { PageLoad } from "./$types";
import { getRecipeCategories, getRecipeTags, listRecipes } from "$lib/api/recipes";

export const load: PageLoad = async ({ fetch, url }) => {
  const filters = {
    q: url.searchParams.get("q") ?? "",
    category: url.searchParams.get("category") ?? "",
    status: url.searchParams.get("status") ?? "",
    tag: url.searchParams.get("tag") ?? "",
    sort: url.searchParams.get("sort") ?? "updatedAt",
    order: url.searchParams.get("order") ?? "desc"
  };

  const [recipes, categories, tags] = await Promise.all([
    listRecipes(fetch, { ...filters, limit: 50, offset: 0 }),
    getRecipeCategories(fetch),
    getRecipeTags(fetch)
  ]);

  return {
    recipes,
    filters,
    categories: categories.items,
    tags: tags.items.map((tag) => tag.name)
  };
};
