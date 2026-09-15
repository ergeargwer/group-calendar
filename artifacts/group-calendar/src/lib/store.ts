import {
  EMPTY_CALENDAR,
  markKey,
  type AvailabilitySummary,
  type CalendarData,
  type DateAvailability,
  type User,
} from "./types";

export function getRoomId(): string {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("g")?.trim() ?? "";
  if (!raw) return "main";
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40);
  return cleaned || "main";
}

export function storageKey(roomId: string): string {
  return `group_calendar_data_v2:${roomId}`;
}

export function loadLocal(roomId: string): CalendarData {
  try {
    const raw = localStorage.getItem(storageKey(roomId));
    if (!raw) return structuredClone(EMPTY_CALENDAR);
    const parsed = JSON.parse(raw) as Partial<CalendarData>;
    return normalize(parsed);
  } catch {
    return structuredClone(EMPTY_CALENDAR);
  }
}

export function saveLocal(roomId: string, data: CalendarData): void {
  localStorage.setItem(storageKey(roomId), JSON.stringify(data));
}

export function normalize(input: Partial<CalendarData> | null | undefined): CalendarData {
  const users = Array.isArray(input?.users) ? input.users.filter(isUser) : [];
  const marks: Record<string, { marked: boolean; ts: number }> = {};
  if (input?.marks && typeof input.marks === "object") {
    for (const [key, value] of Object.entries(input.marks)) {
      if (!value || typeof value !== "object") continue;
      marks[key] = {
        marked: Boolean((value as { marked?: boolean }).marked),
        ts: Number((value as { ts?: number }).ts) || 0,
      };
    }
  }
  const maxId = users.reduce((max, user) => Math.max(max, user.id), 0);
  return {
    users,
    marks,
    nextUserId: Math.max(Number(input?.nextUserId) || 1, maxId + 1),
    updatedAt: Number(input?.updatedAt) || 0,
  };
}

function isUser(value: unknown): value is User {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<User>;
  return (
    typeof user.id === "number" &&
    typeof user.nickname === "string" &&
    typeof user.emoji === "string" &&
    typeof user.createdAt === "string"
  );
}

export function mergeCalendars(a: CalendarData, b: CalendarData): CalendarData {
  const users = mergeUsers(a.users, b.users);
  const marks = { ...a.marks };
  for (const [key, value] of Object.entries(b.marks)) {
    const existing = marks[key];
    if (!existing || value.ts > existing.ts) {
      marks[key] = value;
    }
  }
  const maxId = users.reduce((max, user) => Math.max(max, user.id), 0);
  return {
    users,
    marks,
    nextUserId: Math.max(a.nextUserId, b.nextUserId, maxId + 1),
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

function mergeUsers(a: User[], b: User[]): User[] {
  const byNick = new Map<string, User>();
  const usedIds = new Set<number>();
  const all = [...a, ...b].sort((left, right) => {
    const created = left.createdAt.localeCompare(right.createdAt);
    return created !== 0 ? created : left.id - right.id;
  });
  let nextId = Math.max(0, ...all.map((user) => user.id), 0) + 1;

  for (const user of all) {
    if (byNick.has(user.nickname)) continue;
    let id = user.id;
    if (usedIds.has(id)) {
      id = nextId++;
    }
    usedIds.add(id);
    byNick.set(user.nickname, { ...user, id });
  }

  return Array.from(byNick.values()).sort((left, right) => left.id - right.id);
}

export function createOrGetUser(data: CalendarData, nickname: string, emoji: string): { data: CalendarData; user: User } {
  const existing = data.users.find((user) => user.nickname === nickname);
  if (existing) {
    return { data, user: existing };
  }

  const user: User = {
    id: data.nextUserId,
    nickname,
    emoji,
    createdAt: new Date().toISOString(),
  };

  return {
    data: {
      ...data,
      users: [...data.users, user],
      nextUserId: data.nextUserId + 1,
      updatedAt: Date.now(),
    },
    user,
  };
}

export function toggleMark(data: CalendarData, userId: number, date: string): CalendarData {
  const user = data.users.find((item) => item.id === userId);
  if (!user) return data;

  const key = markKey(user.nickname, date);
  const currently = data.marks[key]?.marked ?? false;
  return {
    ...data,
    marks: {
      ...data.marks,
      [key]: { marked: !currently, ts: Date.now() },
    },
    updatedAt: Date.now(),
  };
}

export function toAvailability(data: CalendarData): DateAvailability[] {
  const byDate = new Map<string, User[]>();
  const usersByNick = new Map(data.users.map((user) => [user.nickname, user]));

  for (const [key, mark] of Object.entries(data.marks)) {
    if (!mark.marked) continue;
    const splitAt = key.indexOf("\t");
    if (splitAt < 0) continue;
    const nickname = key.slice(0, splitAt);
    const date = key.slice(splitAt + 1);
    const user = usersByNick.get(nickname);
    if (!user) continue;
    const list = byDate.get(date) ?? [];
    if (!list.some((item) => item.id === user.id)) {
      list.push(user);
      byDate.set(date, list);
    }
  }

  return Array.from(byDate.entries())
    .map(([date, users]) => ({
      date,
      users,
      count: users.length,
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function toSummary(data: CalendarData): AvailabilitySummary {
  const availability = toAvailability(data);
  const topDates = [...availability].sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    return left.date.localeCompare(right.date);
  });

  return {
    topDates,
    totalUsers: data.users.length,
    totalDaysMarked: availability.length,
  };
}

export function calendarsEqual(a: CalendarData, b: CalendarData): boolean {
  return JSON.stringify(compact(a)) === JSON.stringify(compact(b));
}

function compact(data: CalendarData): CalendarData {
  return {
    users: [...data.users].sort((left, right) => left.id - right.id),
    marks: Object.fromEntries(
      Object.entries(data.marks).sort(([left], [right]) => left.localeCompare(right)),
    ),
    nextUserId: data.nextUserId,
    updatedAt: data.updatedAt,
  };
}
