const Booking = require("../models/Booking");
const generateSlots = require("../utils/generateSlots");
const Service = require("../models/Service");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

// ✅ POST Booking
exports.createBooking = async (req, res) => {
  try {
    const { name, serviceId, date, time, timezone: userTz } = req.body;
    const tz = userTz || process.env.TIMEZONE || "Asia/Kolkata";

    // ❌ Prevent past date/time booking
    const now = dayjs().tz(tz);
    const bookingDateTime = dayjs.tz(`${date} ${time}`, "YYYY-MM-DD HH:mm", tz);

    if (bookingDateTime.isBefore(now)) {
      return res.status(400).json({
        message: "Cannot book past time ❌",
      });
    }

    // 1️⃣ Get service duration
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const duration = service.duration; // in minutes

    // 2️⃣ Calculate how many slots needed
    const slotsNeeded = Math.ceil(duration / 30);

    // 3️⃣ Generate slots
    const allSlots = generateSlots();

    const startIndex = allSlots.indexOf(time);

    if (startIndex === -1) {
      return res.status(400).json({ message: "Invalid time slot" });
    }

    // 4️⃣ Get required slots
    const requiredSlots = allSlots.slice(startIndex, startIndex + slotsNeeded);

    // 5️⃣ Check if any of these slots are already booked
    const existing = await Booking.find({
      date,
      time: { $in: requiredSlots },
    });

    if (existing.length > 0) {
      return res.status(400).json({
        message: "One or more slots already booked ❌",
      });
    }

    // 6️⃣ Create booking (store only start time)
    const booking = await Booking.create({
      name,
      serviceId,
      date,
      time,
    });

    res.status(201).json({
      message: "Booking successful ✅",
      booking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Booking failed" });
  }
};

// ✅ GET AVAILABLE SLOTS
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date, timezone: userTz } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    let slots = generateSlots();

    const bookings = await Booking.find({ date }).populate("serviceId");

    let blockedSlots = [];

    bookings.forEach((booking) => {
      if (!booking.serviceId) return;

      const duration = booking.serviceId.duration || 30;
      const slotsNeeded = Math.ceil(duration / 30);

      const allSlots = generateSlots();
      const startIndex = allSlots.indexOf(booking.time);

      if (startIndex === -1) return;

      const blocked = allSlots.slice(startIndex, startIndex + slotsNeeded);

      blockedSlots.push(...blocked);
    });

    // ❌ remove booked slots
    slots = slots.filter((slot) => !blockedSlots.includes(slot));

    // 🔥 REMOVE PAST SLOTS (timezone-aware)
    const tz = userTz || process.env.TIMEZONE || "Asia/Kolkata";
    const now = dayjs().tz(tz);
    const today = now.format("YYYY-MM-DD");

    if (dayjs(date).isBefore(today, "day")) {
      slots = [];
    } else if (date === today) {
      slots = slots.filter((slot) => {
        const slotTime = dayjs.tz(`${date} ${slot}`, "YYYY-MM-DD HH:mm", tz);
        return slotTime.isAfter(now);
      });
    }

    res.json(slots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching slots" });
  }
};

// ✅ (Optional) GET all bookings for admin
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate("serviceId");
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings" });
  }
};
