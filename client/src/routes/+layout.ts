import type { LayoutLoad } from "./$types";
import { getSession } from "$lib/api/auth";

export const load: LayoutLoad = async ({ fetch }) => {
  return {
    session: await getSession(fetch)
  };
};
