import { pgTable, serial, text, integer, date, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const availabilityTable = pgTable(
  "availability",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
  },
  (t) => [unique().on(t.date, t.userId)],
);

export type Availability = typeof availabilityTable.$inferSelect;
