import { useLocation } from "react-router-dom";
import { useState } from "react";
import API from "../services/api";
import SlotPicker from "../components/SlotPicker";
import "../styles/booking.css";
import Loader from "../components/Loader";
import SuccessModal from "../components/SuccessModal";

const Booking = () => {
  const location = useLocation();
  const service = location.state;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  // Helper to get local date in YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setSlots([]);
    setSelectedSlot("");
  };

  // 🔥 Fetch slots with validation and timezone awareness
  const fetchSlots = async () => {
    if (!date) return alert("Please select a date");

    try {
      setLoading(true);
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await API.get(
        `/api/bookings/available?date=${date}&timezone=${encodeURIComponent(userTimezone)}`
      );

      let availableSlots = res.data;

      // Defensive filtering for remaining time slots if today is selected
      const todayStr = getTodayString();
      if (date === todayStr) {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();

        availableSlots = availableSlots.filter((slot) => {
          const [slotHour, slotMinute] = slot.split(":").map(Number);
          if (slotHour > currentHours) return true;
          if (slotHour === currentHours && slotMinute > currentMinutes) return true;
          return false;
        });
      } else if (date < todayStr) {
        availableSlots = [];
      }

      setSlots(availableSlots);
      setSelectedSlot("");
    } catch (err) {
      console.error(err);
      alert("Failed to load slots");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Booking with validation
  const handleBooking = async () => {
    if (!name || !date || !selectedSlot) {
      return alert("Please fill all details");
    }

    try {
      setLoading(true);
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      await API.post("/api/bookings", {
        name,
        serviceId: service._id,
        date,
        time: selectedSlot,
        timezone: userTimezone,
      });

      setSuccess(true);

      // reset form
      setName("");
      setSelectedSlot("");
      setSlots([]);
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "Booking failed ❌";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-container">
      <h1>{service?.name}</h1>
      <p className="price">₹{service?.price}</p>
      {/* <p className="duration">{service?.duration} mins</p> */}

      {/* INPUTS */}
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="date"
        min={getTodayString()}
        value={date}
        onChange={handleDateChange}
      />

      {/* CHECK SLOT BUTTON */}
      <button className="check-btn" onClick={fetchSlots}>
        Check Available Slots
      </button>

      {/* LOADER */}
      {loading && <Loader />}

      {/* SLOTS */}
      {!loading && slots.length > 0 && (
        <SlotPicker
          slots={slots}
          selected={selectedSlot}
          onSelect={setSelectedSlot}
        />
      )}

      {/* NO SLOTS MESSAGE */}
      {!loading && date && slots.length === 0 && (
        <p className="no-slots">No slots available for this day ❌</p>
      )}

      {/* CONFIRM BUTTON */}
      <button
        className="confirm-btn"
        onClick={handleBooking}
        disabled={loading || !selectedSlot}
      >
        Confirm Booking
      </button>

      {/* SUCCESS MODAL */}
      <SuccessModal show={success} onClose={() => setSuccess(false)} />
    </div>
  );
};

export default Booking;
