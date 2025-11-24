export function calculateDailyReserve(income: number) {
  if (income < 3000) return 600;
  if (income < 4500) return 1000;
  if (income < 6000) return 1200;
  return 1500;
}
