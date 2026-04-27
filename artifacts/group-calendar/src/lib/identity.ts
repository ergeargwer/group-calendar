import { User } from "@workspace/api-client-react";

const IDENTITY_KEY = "group_calendar_identity";

export function getIdentity(): User | null {
  try {
    const data = localStorage.getItem(IDENTITY_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function setIdentity(user: User) {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(user));
}

export function clearIdentity() {
  localStorage.removeItem(IDENTITY_KEY);
}
