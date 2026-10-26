import { NextResponse } from "next/server";
import { readBookings, writeBookings } from "@/lib/db";
import { fetchBookingsFromDB, deleteBookingFromDB } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const authorized = (req) =>
  req.headers.get("x-admin-password") === (process.env.ADMIN_PASSWORD || "change-me");

export async function GET(req) {
  if (!authorized(req)) return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  const res = await fetchBookingsFromDB();
  const list = res?.data || (Array.isArray(res) ? res : await readBookings());
  list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return NextResponse.json({ bookings: list });
}

export async function DELETE(req) {
  if (!authorized(req)) return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  const { id } = await req.json();
  await writeBookings((await readBookings()).filter((b) => b.id !== id));
  await deleteBookingFromDB(id);
  return NextResponse.json({ ok: true });
}

