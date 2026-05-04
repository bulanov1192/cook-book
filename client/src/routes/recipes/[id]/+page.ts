import type { PageLoad } from "./$types";
import { getRecipe } from "$lib/api/recipes";
import { listShoppingLists } from "$lib/api/shopping-lists";

export const load: PageLoad = async ({ fetch, params, parent }) => {
  const { session } = await parent();
  const recipe = await getRecipe(fetch, params.id);
  const shoppingLists = session.isAuthenticated ? await listShoppingLists(fetch) : { items: [] };

  return {
    recipe,
    shoppingLists: shoppingLists.items
  };
};
