import type { PageLoad } from "./$types";
import { listRecipes } from "$lib/api/recipes";
import { getShoppingList } from "$lib/api/shopping-lists";

export const load: PageLoad = async ({ fetch, params, parent }) => {
  const { session } = await parent();
  const list = await getShoppingList(fetch, params.id);
  const recipes =
    session.isAuthenticated && list.canEdit
      ? await listRecipes(fetch, { limit: 50, sort: "updatedAt", order: "desc" })
      : { items: [], meta: { total: 0, limit: 50, offset: 0 } };

  return {
    list,
    recipes: recipes.items
  };
};
