import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readBookings, writeBookings } from "@/lib/db";
import { freeSlots } from "@/lib/slots";
import { SERVICES } from "@/lib/config";
import { insertBookingIntoDB } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { serviceId, date, time, name, phone, notes } = await req.json();
  const cleanName = String(name || "").trim().slice(0, 80);
  const cleanPhone = String(phone || "").trim().slice(0, 30);

  if (!cleanName) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!/^[+\d][\d\s\-()]{6,}$/.test(cleanPhone))
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });

  const bookings = await readBookings();
  if (!freeSlots(date, serviceId, bookings).includes(time))
    return NextResponse.json({ error: "Sorry, that time was just taken. Please pick another." }, { status: 409 });

  const service = SERVICES.find((s) => s.id === serviceId);
  const booking = {
    id: randomUUID(),
    serviceId,
    serviceName: service?.name || serviceId,
    price: service?.price || "",
    mins: service?.mins || 45,
    date,
    time,
    name: cleanName,
    phone: cleanPhone,
    notes: String(notes || "").trim(),
    createdAt: new Date().toISOString(),
  };

  await writeBookings([...bookings, booking]);

  // Sync to Supabase
  insertBookingIntoDB(booking).catch((err) => {
    console.warn("Supabase API insert warning:", err);
  });

  return NextResponse.json({ booking }, { status: 201 });
}

