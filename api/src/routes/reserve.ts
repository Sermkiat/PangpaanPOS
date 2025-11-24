import { Router } from "express";
import { db } from "../db/client.js";
import { asyncHandler, ok } from "../utils/http.js";
import { calculateDailyReserve } from "../utils/debt.js";
import { dailyReserve } from "../db/schema.js";
import { sql } from "drizzle-orm";

const router = Router();

const todayDate = () => new Date().toISOString().slice(0, 10);

router.get(
  "/debts/reserve-today",
  asyncHandler(async (_req, res) => {
    const incomeResult: any = await db.execute(sql`select coalesce(sum(total),0) as sum from orders where date(created_at) = current_date`);
    const income = Number(incomeResult?.rows?.[0]?.sum ?? 0);
    const reserveAmount = calculateDailyReserve(income);
    const today = todayDate();

    await db.execute(sql`delete from daily_reserve where date = ${today}`);
    await db.insert(dailyReserve).values({ date: today, income, reserve: reserveAmount });

    return ok(res, { income, reserve: reserveAmount });
  }),
);

router.get(
  "/debts/reserve-summary",
  asyncHandler(async (_req, res) => {
    const today = todayDate();
    const todayRow: any = await db.execute(sql`select reserve from daily_reserve where date = current_date order by id desc limit 1`);
    const reserveToday = Number(todayRow?.rows?.[0]?.reserve ?? 0);

    const monthCollectedRow: any = await db.execute(
      sql`select coalesce(sum(reserve),0) as sum from daily_reserve where date_trunc('month', date) = date_trunc('month', current_date)`,
    );
    const monthCollected = Number(monthCollectedRow?.rows?.[0]?.sum ?? 0);

    const needRow: any = await db.execute(sql`select coalesce(sum(amount),0) as sum from debts`);
    const needThisMonth = Number(needRow?.rows?.[0]?.sum ?? 0);
    const remaining = Math.max(0, needThisMonth - monthCollected);

    const allDebts: any = await db.query.debts.findMany({ orderBy: (tbl, { asc }) => asc(tbl.dueDay) });
    const day = new Date().getDate();
    const nextDue = allDebts
      .filter((d: any) => d.dueDay >= day)
      .map((d: any) => ({ name: d.name, date: d.dueDay, need: d.amount }))
      .slice(0, 5);

    return ok(res, {
      today: reserveToday,
      monthCollected,
      needThisMonth,
      remaining,
      nextDue,
      date: today,
    });
  }),
);

export default router;
