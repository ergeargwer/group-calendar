import { useMutation, useQuery } from "@tanstack/react-query";
import type { User } from "./types";
import {
  calendarsEqual,
  createOrGetUser,
  getRoomId,
  loadLocal,
  mergeCalendars,
  saveLocal,
  toAvailability,
  toSummary,
  toggleMark,
} from "./store";
import { fetchRemote, pushRemote } from "./remote";
import { getIdentity, setIdentity } from "./identity";

const AVAILABILITY_KEY = ["/api/availability"] as const;
const SUMMARY_KEY = ["/api/availability/summary"] as const;

let memory = loadLocal(getRoomId());
let pushTimer: number | null = null;
let syncing = false;
const syncListeners = new Set<(syncing: boolean) => void>();

function currentRoom(): string {
  return getRoomId();
}

function emitSync(next: boolean) {
  syncing = next;
  for (const listener of syncListeners) listener(syncing);
}

export function subscribeSync(listener: (syncing: boolean) => void): () => void {
  syncListeners.add(listener);
  listener(syncing);
  return () => {
    syncListeners.delete(listener);
  };
}

export function isSyncing(): boolean {
  return syncing;
}

function persist() {
  saveLocal(currentRoom(), memory);
}

function refreshIdentity() {
  const identity = getIdentity();
  if (!identity) return;
  const matched = memory.users.find((user) => user.nickname === identity.nickname);
  if (matched && matched.id !== identity.id) {
    setIdentity(matched);
  }
}

async function pullAndMerge(): Promise<boolean> {
  const remote = await fetchRemote(currentRoom());
  if (!remote) return false;
  const merged = mergeCalendars(memory, remote);
  const changed = !calendarsEqual(merged, memory);
  memory = merged;
  persist();
  refreshIdentity();
  return changed;
}

async function pushNow() {
  emitSync(true);
  try {
    await pullAndMerge();
    await pushRemote(currentRoom(), memory);
  } finally {
    emitSync(false);
  }
}

function schedulePush() {
  if (pushTimer != null) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    void pushNow();
  }, 400);
}

export async function hydrateCalendar(): Promise<void> {
  memory = loadLocal(currentRoom());
  emitSync(true);
  try {
    const changed = await pullAndMerge();
    if (changed || memory.updatedAt > 0) {
      await pushRemote(currentRoom(), memory);
    }
  } catch {
    // Offline: keep local data.
  } finally {
    emitSync(false);
  }
}

export function getGetAvailabilityQueryKey() {
  return AVAILABILITY_KEY;
}

export function getGetAvailabilitySummaryQueryKey() {
  return SUMMARY_KEY;
}

export function useGetAvailability() {
  return useQuery({
    queryKey: AVAILABILITY_KEY,
    queryFn: async () => toAvailability(memory),
    refetchInterval: 12_000,
    refetchOnWindowFocus: true,
  });
}

export function useGetAvailabilitySummary() {
  return useQuery({
    queryKey: SUMMARY_KEY,
    queryFn: async () => toSummary(memory),
    refetchInterval: 12_000,
    refetchOnWindowFocus: true,
  });
}

export function useToggleAvailability() {
  return useMutation({
    mutationFn: async ({ data }: { data: { date: string; userId: number } }) => {
      memory = toggleMark(memory, data.userId, data.date);
      persist();
      schedulePush();
      const availability = toAvailability(memory);
      return (
        availability.find((item) => item.date === data.date) ?? {
          date: data.date,
          users: [],
          count: 0,
        }
      );
    },
  });
}

export function useCreateUser() {
  return useMutation({
    mutationFn: async ({ data }: { data: { nickname: string; emoji: string } }) => {
      const result = createOrGetUser(memory, data.nickname.trim(), data.emoji);
      memory = result.data;
      persist();
      schedulePush();
      return result.user;
    },
  });
}

export function resolveUser(user: User | null): User | null {
  if (!user) return null;
  return memory.users.find((item) => item.nickname === user.nickname) ?? user;
}

export async function pollRemote(): Promise<boolean> {
  try {
    return await pullAndMerge();
  } catch {
    return false;
  }
}
