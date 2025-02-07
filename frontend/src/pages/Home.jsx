import React from "react";
import { Link } from "react-router-dom";
import Testimonials from "../components/Testimonials";

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-blue-500 text-white text-center py-20">
        <h1 className="text-4xl font-bold">Find Your Perfect Cricket Coach</h1>
        <p className="mt-4 text-lg">Book expert coaching sessions to improve your game.</p>
        <Link to="/register">
          <button className="mt-6 bg-white text-blue-500 font-semibold px-6 py-2 rounded-lg shadow-md">
            Get Started
          </button>
        </Link>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto my-10 text-center">
        <h2 className="text-2xl font-bold">Why Choose CricCoach?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="p-6 border rounded-lg shadow-md">
            <h3 className="font-bold text-lg">🏏 Expert Coaches</h3>
            <p>Train with certified professionals who have years of experience.</p>
          </div>
          <div className="p-6 border rounded-lg shadow-md">
            <h3 className="font-bold text-lg">📅 Flexible Scheduling</h3>
            <p>Choose your preferred time slots and reschedule if needed.</p>
          </div>
          <div className="p-6 border rounded-lg shadow-md">
            <h3 className="font-bold text-lg">💳 Secure Payments</h3>
            <p>Make hassle-free online payments with Stripe integration.</p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <Testimonials />
    </div>
  );
};

export default Home;
