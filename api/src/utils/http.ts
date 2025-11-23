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

export function fail(res: Response, error: unknown, status = 400) {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
  return res.status(status).json({ success: false, error: message });
}
