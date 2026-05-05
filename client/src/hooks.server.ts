import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import type { HandleFetch } from "@sveltejs/kit";

const publicApiBaseUrl = publicEnv.PUBLIC_API_BASE_URL?.trim() || "";
const publicApiOrigin = publicApiBaseUrl ? new URL(publicApiBaseUrl).origin : null;
const internalApiBaseUrl =
  privateEnv.INTERNAL_API_BASE_URL?.trim() || publicApiBaseUrl || "";

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  const requestUrl = new URL(request.url);
  const isSameOriginApiRequest =
    requestUrl.origin === event.url.origin && requestUrl.pathname.startsWith("/api/");
  const isPublicApiRequest = publicApiOrigin ? request.url.startsWith(publicApiOrigin) : false;

  if (internalApiBaseUrl && (isSameOriginApiRequest || isPublicApiRequest)) {
    const headers = new Headers(request.headers);
    const cookie = event.request.headers.get("cookie");

    if (cookie) {
      headers.set("cookie", cookie);
    }

    request = new Request(new URL(`${requestUrl.pathname}${requestUrl.search}`, internalApiBaseUrl), {
      headers
    });
  }

  return fetch(request);
};
