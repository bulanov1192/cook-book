import { AppError } from "../shared/errors/app-error.js";

export type AppRole = "anonymous" | "user" | "admin";

export type AccessContext = {
  role: AppRole;
  userId: string | null;
  sessionId: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: Exclude<AppRole, "anonymous">;
  } | null;
};

export type SessionLike = {
  session: {
    id: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
    role?: string | null;
  };
} | null;

export function getEffectiveRole(session: SessionLike, adminEmails: string[]): AppRole {
  if (!session) {
    return "anonymous";
  }

  const email = session.user.email.trim().toLowerCase();

  if (adminEmails.includes(email) || session.user.role === "admin") {
    return "admin";
  }

  return "user";
}

export function toAccessContext(session: SessionLike, adminEmails: string[]): AccessContext {
  const role = getEffectiveRole(session, adminEmails);

  if (!session || role === "anonymous") {
    return {
      role: "anonymous",
      userId: null,
      sessionId: null,
      user: null
    };
  }

  return {
    role,
    userId: session.user.id,
    sessionId: session.session.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role
    }
  };
}

export function isAuthenticated(access: AccessContext): access is AccessContext & {
  role: "user" | "admin";
  userId: string;
  sessionId: string;
  user: NonNullable<AccessContext["user"]>;
} {
  return access.role !== "anonymous" && Boolean(access.userId) && Boolean(access.user);
}

export function isAdmin(access: AccessContext): boolean {
  return access.role === "admin";
}

export function canManageOwnedEntity(ownerId: string | null, access: AccessContext): boolean {
  if (!ownerId) {
    return false;
  }

  if (isAdmin(access)) {
    return true;
  }

  return access.userId === ownerId;
}

export function requireAuthenticated(access: AccessContext, message = "Authentication is required") {
  if (!isAuthenticated(access)) {
    throw new AppError(401, "AUTH_REQUIRED", message);
  }

  return access;
}
