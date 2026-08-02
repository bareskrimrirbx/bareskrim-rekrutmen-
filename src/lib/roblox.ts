// ============================================================
// Roblox API Client (public endpoints, tanpa auth token)
// ============================================================

export interface RobloxUserInfo {
  id: number;
  name: string;
  displayName: string;
  description?: string;
}

export interface RobloxGroupRole {
  groupId: number;
  groupName: string;
  roleId: number;
  roleName: string;
  roleRank: number;
  isPrimary: boolean;
}

const ROBLOX_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "BareskrimRekrutmen/1.0 (roleplay-community)",
};

async function robloxFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { ...ROBLOX_HEADERS, ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`Roblox API error ${res.status} for ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// Resolve username -> user info (id, name, displayName)
export async function resolveUserByUsername(
  username: string
): Promise<RobloxUserInfo | null> {
  const body = { usernames: [username.trim()], excludeBannedUsers: true };
  const json = await robloxFetch<{
    data: Array<{
      requestedUsername: string;
      hasVerifiedBadge: boolean;
      id: number;
      name: string;
      displayName: string;
    }>;
  }>("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const hit = json.data.find((u) => u.requestedUsername.toLowerCase() === username.trim().toLowerCase());
  if (!hit) return null;
  return { id: hit.id, name: hit.name, displayName: hit.displayName };
}

// Ambil avatar headshot terbaru
export async function getAvatarHeadshot(userId: number): Promise<string | null> {
  try {
    const json = await robloxFetch<{
      data: Array<{ targetId: number; state: string; imageUrl: string }>;
    }>(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=720x720&format=Png&isCircular=false`
    );
    const item = json.data?.[0];
    if (item && item.state === "Completed" && item.imageUrl) return item.imageUrl;
    return null;
  } catch {
    return null;
  }
}

// Ambil seluruh keanggotaan grup user
export async function getUserGroups(userId: number): Promise<RobloxGroupRole[]> {
  const json = await robloxFetch<{
    data: Array<{
      group: { id: number; name: string };
      role: { id: number; name: string; rank: number };
      isPrimaryGroup: boolean;
    }>;
  }>(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);

  return json.data.map((g) => ({
    groupId: g.group.id,
    groupName: g.group.name,
    roleId: g.role.id,
    roleName: g.role.name,
    roleRank: g.role.rank,
    isPrimary: g.isPrimaryGroup,
  }));
}

export function profileUrl(userId: number): string {
  return `https://www.roblox.com/users/${userId}/profile`;
}
