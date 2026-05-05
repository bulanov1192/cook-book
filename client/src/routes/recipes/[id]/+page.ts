import type { PageLoad } from "./$types";
import { getRecipe, getRecipeComments } from "$lib/api/recipes";
import { listShoppingLists } from "$lib/api/shopping-lists";

export const load: PageLoad = async ({ fetch, params, parent }) => {
  const { session } = await parent();
  const [recipe, comments, shoppingLists] = await Promise.all([
    getRecipe(fetch, params.id),
    getRecipeComments(fetch, params.id, { limit: 50, offset: 0 }),
    session.isAuthenticated ? listShoppingLists(fetch, { limit: 50, offset: 0 }) : { items: [], meta: { total: 0, limit: 50, offset: 0 } }
  ]);

  return {
    recipe,
    comments,
    session,
    shoppingLists: shoppingLists.items
  };
};
