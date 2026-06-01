import type { UserRole } from "@prisma/client";

export type RoleCheckUser = {
  role?: UserRole | null;
};

export type RoleOption = {
  value: UserRole;
  label: string;
  description: string;
};

export type RoleRouteRule = {
  prefix: string;
  allowedRoles: readonly UserRole[];
};

export const ROLE_OPTIONS = [
  {
    value: "USER",
    label: "User",
    description: "Explore venues, save favorites, and leave reviews.",
  },
  {
    value: "VENUE_OWNER",
    label: "Venue owner",
    description: "Manage venue information and reply to reviews.",
  },
  {
    value: "EVENT_ORGANIZER",
    label: "Event organizer",
    description: "Create and manage events hosted at venues.",
  },
  {
    value: "MODERATOR",
    label: "Moderator",
    description: "Review reports and moderate user content.",
  },
  {
    value: "ADMIN",
    label: "Admin",
    description: "Manage users, roles, and platform-wide settings.",
  },
] as const satisfies readonly RoleOption[];

export const REGISTRATION_ROLE_OPTIONS = ROLE_OPTIONS.filter(
  ({ value }) =>
    value === "USER" || value === "VENUE_OWNER" || value === "EVENT_ORGANIZER",
);

export const ROLE_HOME_PATHS = {
  USER: "/",
  VENUE_OWNER: "/venues",
  EVENT_ORGANIZER: "/events",
  MODERATOR: "/moderation",
  ADMIN: "/admin",
} as const satisfies Record<UserRole, string>;

export const ROLE_ROUTE_RULES: readonly RoleRouteRule[] = [
  {
    prefix: "/admin",
    allowedRoles: ["ADMIN"],
  },
  {
    prefix: "/moderation",
    allowedRoles: ["MODERATOR", "ADMIN"],
  },
  {
    prefix: "/organizer",
    allowedRoles: ["EVENT_ORGANIZER", "MODERATOR", "ADMIN"],
  },
  {
    prefix: "/events/manage",
    allowedRoles: ["EVENT_ORGANIZER", "MODERATOR", "ADMIN"],
  },
  {
    prefix: "/venues/manage",
    allowedRoles: ["VENUE_OWNER", "MODERATOR", "ADMIN"],
  },
];

const ROLE_VALUES = ROLE_OPTIONS.map(({ value }) => value);
const REGISTRATION_ROLE_VALUES = REGISTRATION_ROLE_OPTIONS.map(
  ({ value }) => value,
);

const ROLE_RANK = {
  USER: 0,
  VENUE_OWNER: 1,
  EVENT_ORGANIZER: 1,
  MODERATOR: 2,
  ADMIN: 3,
} as const satisfies Record<UserRole, number>;

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && ROLE_VALUES.includes(value as UserRole);
}

export function parseUserRole(value: unknown): UserRole | null {
  return isUserRole(value) ? value : null;
}

export function isRegistrationRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    REGISTRATION_ROLE_VALUES.includes(value as UserRole)
  );
}

export function parseRegistrationRole(value: unknown): UserRole | null {
  return isRegistrationRole(value) ? value : null;
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_OPTIONS.find(({ value }) => value === role)?.label ?? role;
}

export function getRoleHomePath(role: UserRole): string {
  return ROLE_HOME_PATHS[role];
}

export function getRouteRule(pathname: string) {
  return ROLE_ROUTE_RULES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function hasRole(
  user: RoleCheckUser | null | undefined,
  role: UserRole,
): boolean {
  return user?.role === role;
}

export function hasAnyRole(
  user: RoleCheckUser | null | undefined,
  allowedRoles: readonly UserRole[],
): boolean {
  return Boolean(user?.role && allowedRoles.includes(user.role));
}

export function hasMinimumRole(
  user: RoleCheckUser | null | undefined,
  minimumRole: UserRole,
): boolean {
  return Boolean(user?.role && ROLE_RANK[user.role] >= ROLE_RANK[minimumRole]);
}

export function canManageVenue(
  user: RoleCheckUser | null | undefined,
): boolean {
  return hasAnyRole(user, ["VENUE_OWNER", "MODERATOR", "ADMIN"]);
}

export function canManageEvent(
  user: RoleCheckUser | null | undefined,
): boolean {
  return hasAnyRole(user, ["EVENT_ORGANIZER", "MODERATOR", "ADMIN"]);
}

export function canModerateContent(
  user: RoleCheckUser | null | undefined,
): boolean {
  return hasAnyRole(user, ["MODERATOR", "ADMIN"]);
}

export function canManageUsers(
  user: RoleCheckUser | null | undefined,
): boolean {
  return hasRole(user, "ADMIN");
}
