import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import ServiceCard from "../components/ServiceCard";
import "../styles/home.css";

const Home = () => {
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/api/services")
      .then((res) => setServices(res.data))
      .catch((err) => console.log(err));
  }, []);

  const handleBook = (service) => {
    navigate("/book", { state: service });
  };

  return (
    <div className="container">
      <h1>Trim Time ✂️</h1>

      {/* SERVICES */}
      <div className="services">
        {services.map((service) => (
          <ServiceCard
            key={service._id}
            service={service}
            onBook={handleBook}
          />
        ))}
      </div>

      {/* 🔥 OUR WORK SECTION */}
      <h2 className="section-title">Our Work</h2>

      <div className="gallery">
        <img src="./1.jpg" />
        <img src="./2.jpg" />
        <img src="./3.jpg" />
        <img src="./4.jpg" />
        <img src="./5.jpg" />
        <img src="./6.jpg" />
        <img src="./7.jpg" />
        <img src="./8.jpg" />
        <img src="./9.jpg" />
        <img src="./10.jpg" />
        <img src="./11.jpg" />
        <img src="./12.jpg" />
        <img src="./13.jpg" />
        <img src="./14.jpg" />
        <img src="./15.jpg" />
        <img src="./16.jpg" />
        <img src="./17.jpg" />
        <img src="./18.jpg" />
        <img src="./19.jpg" />
        <img src="./20.jpg" />
      </div>
    </div>
  );
};

export default Home;
