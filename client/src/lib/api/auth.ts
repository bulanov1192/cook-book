import { loadRequest, request } from "./http";
import type {
  SessionResponse,
  SignInPayload,
  SignUpPayload,
  UpdatePreferencesPayload
} from "./types";

export async function getSession(fetcher: typeof fetch) {
  return loadRequest<SessionResponse>(fetcher, "/api/session");
}

export async function signIn(payload: SignInPayload) {
  return request<{
    token: string | null;
    user: {
      id: string;
      email: string;
      name: string;
    };
  }>("/api/auth/sign-in/email", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function signUp(payload: SignUpPayload) {
  return request<{
    token: string | null;
    user: {
      id: string;
      email: string;
      name: string;
    };
  }>("/api/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function signOut() {
  return request<{ success: boolean }>("/api/auth/sign-out", {
    method: "POST"
  });
}

export async function updatePreferences(payload: UpdatePreferencesPayload) {
  return request<{
    ok: true;
    preferences: UpdatePreferencesPayload;
  }>("/api/profile/preferences", {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
