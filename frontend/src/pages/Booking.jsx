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

  // 🔥 Fetch slots with validation
  const fetchSlots = async () => {
    if (!date) return alert("Please select a date");

    try {
      setLoading(true);
      const res = await API.get(`/api/bookings/available?date=${date}`);
      setSlots(res.data);
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

      await API.post("/api/bookings", {
        name,
        serviceId: service._id,
        date,
        time: selectedSlot,
      });

      setSuccess(true);

      // reset form
      setName("");
      setSelectedSlot("");
      setSlots([]);
    } catch (err) {
      console.error(err);
      alert("Booking failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-container">
      <h1>{service.name}</h1>
      <p className="price">₹{service.price}</p>
      {/* <p className="duration">{service.duration} mins</p> */}

      {/* INPUTS */}
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="date"
        min={new Date().toISOString().split("T")[0]}
        value={date}
        onChange={(e) => setDate(e.target.value)}
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
        disabled={loading}
      >
        Confirm Booking
      </button>

      {/* SUCCESS MODAL */}
      <SuccessModal show={success} onClose={() => setSuccess(false)} />
    </div>
  );
};

export default Booking;
