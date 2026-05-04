import { env } from "$env/dynamic/public";
import type { HandleFetch } from "@sveltejs/kit";

const apiBaseUrl = env.PUBLIC_API_BASE_URL || "http://localhost:3000";
const apiOrigin = new URL(apiBaseUrl).origin;

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  if (request.url.startsWith(apiOrigin)) {
    const headers = new Headers(request.headers);
    const cookie = event.request.headers.get("cookie");

    if (cookie) {
      headers.set("cookie", cookie);
    }

    request = new Request(request, {
      headers
    });
  }

  return fetch(request);
};
