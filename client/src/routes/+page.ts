import type { PageLoad } from "./$types";
import { listRecipes } from "$lib/api/recipes";
import { listShoppingLists } from "$lib/api/shopping-lists";

export const load: PageLoad = async ({ fetch, parent }) => {
  const { session } = await parent();

  const publishedRecipeResponse = await listRecipes(fetch, {
    limit: session.isAuthenticated ? 1 : 4,
    status: "published",
    sort: "updatedAt",
    order: "desc"
  });

  if (!session.isAuthenticated) {
    return {
      recentRecipes: publishedRecipeResponse.items,
      shoppingLists: [],
      recipeCount: publishedRecipeResponse.meta.total,
      publishedRecipeCount: publishedRecipeResponse.meta.total,
      shoppingListCount: 0
    };
  }

  const [recipeResponse, shoppingListResponse] = await Promise.all([
    listRecipes(fetch, {
      limit: 4,
      sort: "updatedAt",
      order: "desc"
    }),
    listShoppingLists(fetch)
  ]);

  return {
    recentRecipes: recipeResponse.items,
    shoppingLists: shoppingListResponse.items.slice(0, 3),
    recipeCount: recipeResponse.meta.total,
    publishedRecipeCount: publishedRecipeResponse.meta.total,
    shoppingListCount: shoppingListResponse.meta.total
  };
};
