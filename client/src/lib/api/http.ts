import { env } from "$env/dynamic/public";
import type { ApiErrorPayload } from "./types";

const API_BASE_URL = env.PUBLIC_API_BASE_URL || "http://localhost:3000";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, payload: ApiErrorPayload["error"]) {
    super(payload.message);
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

function createUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let payload: ApiErrorPayload | null = null;

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }

  throw new ApiError(
    response.status,
    payload?.error ?? {
      code: "HTTP_ERROR",
      message: response.statusText || "Unexpected API error"
    }
  );
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(createUrl(path), {
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  return parseResponse<T>(response);
}

export async function loadRequest<T>(
  fetcher: typeof fetch,
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetcher(createUrl(path), {
    credentials: "include",
    ...init
  });
  return parseResponse<T>(response);
}

export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    query.set(key, String(value));
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}
