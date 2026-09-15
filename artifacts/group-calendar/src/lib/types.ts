export type User = {
  id: number;
  nickname: string;
  emoji: string;
  createdAt: string;
};

export type DateAvailability = {
  date: string;
  users: User[];
  count: number;
};

export type AvailabilitySummary = {
  topDates: DateAvailability[];
  totalUsers: number;
  totalDaysMarked: number;
};

export type CreateUserBody = {
  nickname: string;
  emoji: string;
};

export type ToggleAvailabilityBody = {
  date: string;
  userId: number;
};

export type Mark = {
  marked: boolean;
  ts: number;
};

export type CalendarData = {
  users: User[];
  marks: Record<string, Mark>;
  nextUserId: number;
  updatedAt: number;
};

export const EMPTY_CALENDAR: CalendarData = {
  users: [],
  marks: {},
  nextUserId: 1,
  updatedAt: 0,
};

export function markKey(nickname: string, date: string): string {
  return `${nickname}\t${date}`;
}
