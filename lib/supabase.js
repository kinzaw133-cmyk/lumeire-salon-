import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://evwowixearvwpwcbmaxj.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_J1NvdfmuJX--eXgIinmGlQ_a4_swRwD";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch all salon bookings from Supabase
 * Returns { data, error } so caller can inspect real errors or render appointments.
 */
export async function fetchBookingsFromDB() {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      console.error("Supabase bookings fetch error:", error.message || error);
      return { data: null, error: error.message || String(error) };
    }

    if (!Array.isArray(data)) return { data: [], error: null };

    const mapped = data.map((b) => ({
      id: b.id,
      serviceId: b.service_id || b.serviceId,
      service_id: b.service_id || b.serviceId,
      serviceName: b.service_name || b.serviceName,
      service_name: b.service_name || b.serviceName,
      price: b.price || "",
      mins: b.mins || 45,
      date: b.date,
      time: b.time,
      name: b.name,
      phone: b.phone,
      notes: b.notes || "",
      status: b.status || "confirmed",
      createdAt: b.created_at,
    }));

    return { data: mapped, error: null };
  } catch (err) {
    console.error("Error communicating with Supabase:", err);
    return { data: null, error: err.message || String(err) };
  }
}

/**
 * Insert a new appointment into Supabase
 */
export async function insertBookingIntoDB(booking) {
  try {
    const payload = {
      id: booking.id,
      service_id: booking.service_id || booking.serviceId,
      service_name: booking.service_name || booking.serviceName || "",
      price: booking.price,
      mins: booking.mins || 45,
      date: booking.date,
      time: booking.time,
      name: booking.name,
      phone: booking.phone,
      notes: booking.notes || "",
      status: "confirmed",
    };

    const { data, error } = await supabase
      .from("bookings")
      .insert([payload]);

    if (error) {
      console.warn("Supabase insert error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.warn("Supabase insert exception:", err);
    return { success: false, error: err.message };
  }
}


/**
 * Delete / Cancel an appointment in Supabase
 */
export async function deleteBookingFromDB(bookingId) {
  try {
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId);

    if (error) {
      console.error("Supabase delete error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Supabase delete exception:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch salon services from Supabase
 * Returns null if table not yet initialized
 */
export async function fetchServicesFromDB() {
  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true);

    if (error || !data || data.length === 0) {
      return null;
    }

    return data.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      price: s.price,
      priceNum: Number(s.price_num) || 0,
      mins: s.mins,
      minutes: s.mins,
      icon: s.icon,
      iconName: s.icon_name,
      description: s.description,
      perks: Array.isArray(s.perks) ? s.perks : [],
    }));
  } catch {
    return null;
  }
}

/**
 * Submit contact inquiry / VIP consultation request to Supabase
 */
export async function submitContactInquiryToDB(formData) {
  try {
    const { data, error } = await supabase
      .from("form_submissions")
      .insert([
        {
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          subject: formData.subject || "Salon Inquiry",
          message: formData.message,
          status: "unread",
        },
      ]);

    if (error) {
      console.warn("Supabase contact submit error:", error.message);
      return { success: false, error: error.message };
    }


    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
