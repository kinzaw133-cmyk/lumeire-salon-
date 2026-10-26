import { promises as fs } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "bookings.json");

export async function readBookings() {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return [];
  }
}

export async function writeBookings(list) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(list, null, 2));
}
