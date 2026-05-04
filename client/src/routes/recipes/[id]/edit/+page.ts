import type { PageLoad } from "./$types";
import { getRecipe } from "$lib/api/recipes";

export const load: PageLoad = async ({ fetch, params }) => {
  return {
    recipe: await getRecipe(fetch, params.id)
  };
};
