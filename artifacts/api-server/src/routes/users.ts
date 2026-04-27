import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { CreateUserBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users);
});

router.post("/", async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { nickname, emoji } = parsed.data;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.nickname, nickname))
    .limit(1);

  if (existing.length > 0) {
    res.json(existing[0]);
    return;
  }

  const [created] = await db.insert(usersTable).values({ nickname, emoji }).returning();
  res.json(created);
});

export default router;
