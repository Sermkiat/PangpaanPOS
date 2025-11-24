// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.INTERNAL_API_BASE || "http://api:8000";

const forward = async (req: NextRequest, params: { path?: string[] }) => {
  const targetPath = params.path?.join("/") ?? "";
  const url = `${API_BASE}/${targetPath}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (["host", "connection", "content-length"].includes(key.toLowerCase())) return;
    headers.set(key, value);
  });

  const bodyNeeded = !["GET", "HEAD"].includes(req.method.toUpperCase());
  const body = bodyNeeded ? await req.text() : undefined;

  const res = await fetch(url, {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  });

  const buf = await res.arrayBuffer();
  const nextRes = new NextResponse(buf, { status: res.status });
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "content-length") return;
    nextRes.headers.set(key, value);
  });
  return nextRes;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req: NextRequest, context: any) {
  const params = (await context?.params) || context?.params || {};
  return forward(req, params);
}
export async function POST(req: NextRequest, context: any) {
  const params = (await context?.params) || context?.params || {};
  return forward(req, params);
}
export async function PUT(req: NextRequest, context: any) {
  const params = (await context?.params) || context?.params || {};
  return forward(req, params);
}
export async function PATCH(req: NextRequest, context: any) {
  const params = (await context?.params) || context?.params || {};
  return forward(req, params);
}
export async function DELETE(req: NextRequest, context: any) {
  const params = (await context?.params) || context?.params || {};
  return forward(req, params);
}
export async function OPTIONS(req: NextRequest, context: any) {
  const params = (await context?.params) || context?.params || {};
  return forward(req, params);
}
