import { EMPTY_CALENDAR, type CalendarData } from "./types";
import { normalize } from "./store";

const RENTRY_API = "https://rentry.org/api";
const DEFAULT_SLUG = "ergeargwer-group-calendar";
const DEFAULT_EDIT_CODE = "gc-share-2026";

type RemoteTarget = {
  slug: string;
  editCode: string;
};

export function remoteTarget(roomId: string): RemoteTarget {
  if (roomId === "main") {
    return { slug: DEFAULT_SLUG, editCode: DEFAULT_EDIT_CODE };
  }
  const slug = `gc-${roomId}`.toLowerCase().slice(0, 80);
  return { slug, editCode: `gc2026-${roomId}` };
}

export async function fetchRemote(roomId: string): Promise<CalendarData | null> {
  const target = remoteTarget(roomId);
  try {
    const fromRentry = await fetchRentry(target);
    if (fromRentry) return fromRentry;
  } catch {
    // Fall through to GitHub snapshot.
  }

  if (roomId === "main") {
    try {
      return await fetchGithubSnapshot();
    } catch {
      return null;
    }
  }

  return null;
}

export async function pushRemote(roomId: string, data: CalendarData): Promise<void> {
  const target = remoteTarget(roomId);
  const body = new URLSearchParams({
    edit_code: target.editCode,
    text: JSON.stringify(data),
  });

  const editResponse = await fetch(`${RENTRY_API}/edit/${encodeURIComponent(target.slug)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (editResponse.ok) {
    const result = (await editResponse.json()) as { status?: string };
    if (result.status === "200") return;
  }

  const created = await createRentry(target, data);
  if (!created) {
    throw new Error("無法同步到共用日曆");
  }
}

async function fetchRentry(target: RemoteTarget): Promise<CalendarData | null> {
  const body = new URLSearchParams({ edit_code: target.editCode });
  const response = await fetch(`${RENTRY_API}/fetch/${encodeURIComponent(target.slug)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) return null;

  const result = (await response.json()) as {
    status?: string;
    content?: { text?: string } | string;
  };
  if (result.status !== "200" || !result.content || typeof result.content === "string") {
    return null;
  }

  try {
    return normalize(JSON.parse(result.content.text ?? ""));
  } catch {
    return structuredClone(EMPTY_CALENDAR);
  }
}

async function createRentry(target: RemoteTarget, data: CalendarData): Promise<boolean> {
  const body = new URLSearchParams({
    url: target.slug,
    edit_code: target.editCode,
    text: JSON.stringify(data),
  });
  const response = await fetch(`${RENTRY_API}/new`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) return false;
  const result = (await response.json()) as { status?: string };
  return result.status === "200";
}

async function fetchGithubSnapshot(): Promise<CalendarData | null> {
  const urls = [
    `${import.meta.env.BASE_URL}data/calendar.json?t=${Date.now()}`,
    `https://raw.githubusercontent.com/ergeargwer/group-calendar/main/data/calendar.json?t=${Date.now()}`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) continue;
      return normalize(await response.json());
    } catch {
      continue;
    }
  }
  return null;
}
