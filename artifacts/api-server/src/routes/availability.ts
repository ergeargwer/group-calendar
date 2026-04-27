import { Router } from "express";
import { db, availabilityTable, usersTable } from "@workspace/db";
import { ToggleAvailabilityBody } from "@workspace/api-zod";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const rows = await db
    .select({
      date: availabilityTable.date,
      userId: availabilityTable.userId,
      userNickname: usersTable.nickname,
      userEmoji: usersTable.emoji,
      userCreatedAt: usersTable.createdAt,
    })
    .from(availabilityTable)
    .innerJoin(usersTable, eq(availabilityTable.userId, usersTable.id))
    .orderBy(availabilityTable.date);

  const byDate = new Map<string, { date: string; users: { id: number; nickname: string; emoji: string; createdAt: Date }[] }>();
  for (const row of rows) {
    const dateStr = typeof row.date === "string" ? row.date : (row.date as Date).toISOString().split("T")[0];
    if (!byDate.has(dateStr)) {
      byDate.set(dateStr, { date: dateStr, users: [] });
    }
    byDate.get(dateStr)!.users.push({
      id: row.userId,
      nickname: row.userNickname,
      emoji: row.userEmoji,
      createdAt: row.userCreatedAt,
    });
  }

  const result = Array.from(byDate.values()).map((d) => ({
    ...d,
    count: d.users.length,
  }));

  res.json(result);
});

router.post("/toggle", async (req, res) => {
  const parsed = ToggleAvailabilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { date, userId } = parsed.data;

  const existing = await db
    .select()
    .from(availabilityTable)
    .where(and(eq(availabilityTable.date, date), eq(availabilityTable.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(availabilityTable)
      .where(and(eq(availabilityTable.date, date), eq(availabilityTable.userId, userId)));
  } else {
    await db.insert(availabilityTable).values({ date, userId });
  }

  const rows = await db
    .select({
      date: availabilityTable.date,
      userId: availabilityTable.userId,
      userNickname: usersTable.nickname,
      userEmoji: usersTable.emoji,
      userCreatedAt: usersTable.createdAt,
    })
    .from(availabilityTable)
    .innerJoin(usersTable, eq(availabilityTable.userId, usersTable.id))
    .where(eq(availabilityTable.date, date));

  const users = rows.map((r) => ({
    id: r.userId,
    nickname: r.userNickname,
    emoji: r.userEmoji,
    createdAt: r.userCreatedAt,
  }));

  res.json({ date, users, count: users.length });
});

router.get("/summary", async (req, res) => {
  const totalUsersResult = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const totalUsers = totalUsersResult[0]?.count ?? 0;

  const totalDaysResult = await db
    .select({ count: sql<number>`count(distinct date)::int` })
    .from(availabilityTable);
  const totalDaysMarked = totalDaysResult[0]?.count ?? 0;

  const rows = await db
    .select({
      date: availabilityTable.date,
      userId: availabilityTable.userId,
      userNickname: usersTable.nickname,
      userEmoji: usersTable.emoji,
      userCreatedAt: usersTable.createdAt,
    })
    .from(availabilityTable)
    .innerJoin(usersTable, eq(availabilityTable.userId, usersTable.id))
    .orderBy(availabilityTable.date);

  const byDate = new Map<string, { date: string; users: { id: number; nickname: string; emoji: string; createdAt: Date }[] }>();
  for (const row of rows) {
    const dateStr = typeof row.date === "string" ? row.date : (row.date as Date).toISOString().split("T")[0];
    if (!byDate.has(dateStr)) {
      byDate.set(dateStr, { date: dateStr, users: [] });
    }
    byDate.get(dateStr)!.users.push({
      id: row.userId,
      nickname: row.userNickname,
      emoji: row.userEmoji,
      createdAt: row.userCreatedAt,
    });
  }

  const topDates = Array.from(byDate.values())
    .map((d) => ({ ...d, count: d.users.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  res.json({ topDates, totalUsers, totalDaysMarked });
});

export default router;
