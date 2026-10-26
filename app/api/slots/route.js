import { NextResponse } from "next/server";
import { readBookings } from "@/lib/db";
import { freeSlots } from "@/lib/slots";
import { fetchBookingsFromDB } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const res = await fetchBookingsFromDB();
  const bookings = res?.data || (Array.isArray(res) ? res : await readBookings());
  const slots = freeSlots(searchParams.get("date"), searchParams.get("service"), bookings);
  return NextResponse.json({ slots });
}

