import { NextFunction, Request, Response } from "express";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

type AnyError = Error & { status?: number; detail?: unknown };

export function fail(res: Response, error: unknown, defaultStatus = 400) {
  const err = error as AnyError;
  const status = typeof err?.status === "number" ? err.status : defaultStatus;
  const detail = (err as any)?.detail;
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
  const payload: Record<string, unknown> = { success: false, error: message };
  if (detail) payload.detail = detail;
  return res.status(status).json(payload);
}
