import type { PageLoad } from "./$types";
import { listShoppingLists } from "$lib/api/shopping-lists";

export const load: PageLoad = async ({ fetch, parent }) => {
  const { session } = await parent();

  if (!session.isAuthenticated) {
    return {
      lists: {
        items: [],
        meta: {
          total: 0,
          limit: 50,
          offset: 0
        }
      }
    };
  }

  return {
    lists: await listShoppingLists(fetch, { limit: 50, offset: 0 })
  };
};
