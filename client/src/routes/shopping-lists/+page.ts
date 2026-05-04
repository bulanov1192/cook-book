import type { PageLoad } from "./$types";
import { listShoppingLists } from "$lib/api/shopping-lists";

export const load: PageLoad = async ({ fetch, parent }) => {
  const { session } = await parent();

  if (!session.isAuthenticated) {
    return {
      lists: {
        items: []
      }
    };
  }

  return {
    lists: await listShoppingLists(fetch)
  };
};
