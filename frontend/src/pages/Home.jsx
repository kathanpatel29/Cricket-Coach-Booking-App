import React from "react";
import { Link } from "react-router-dom";
import Testimonials from "../components/features/Testimonials";

const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-blue-500 text-white text-center py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Elevate Your Cricket Game with Expert Coaching
          </h1>
          <p className="mt-6 text-lg md:text-xl">
            Connect with professional cricket coaches and transform your technique, 
            fitness, and match performance.
          </p>
          <Link to="/register">
            <button className="mt-8 bg-white text-blue-500 font-semibold px-8 py-3 rounded-lg shadow-md hover:bg-gray-100 transition duration-300">
              Start Your Journey
            </button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto my-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose CricCoach?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg shadow-md hover:shadow-lg transition duration-300">
            <h3 className="font-bold text-xl mb-4">🏏 Expert Coaches</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• International and First-Class experience</li>
              <li>• Certified coaching qualifications</li>
              <li>• Specialized in batting, bowling, and fielding</li>
            </ul>
          </div>
          <div className="p-6 border rounded-lg shadow-md hover:shadow-lg transition duration-300">
            <h3 className="font-bold text-xl mb-4">📅 Flexible Training</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Book sessions at your convenience</li>
              <li>• One-on-one personalized coaching</li>
              <li>• Indoor and outdoor facilities</li>
            </ul>
          </div>
          <div className="p-6 border rounded-lg shadow-md hover:shadow-lg transition duration-300">
            <h3 className="font-bold text-xl mb-4">🎯 Comprehensive Training</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Video analysis of technique</li>
              <li>• Mental conditioning</li>
              <li>• Match strategy sessions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="font-bold mb-2">Register</h3>
              <p className="text-gray-600">Create your free account</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="font-bold mb-2">Choose Coach</h3>
              <p className="text-gray-600">Browse expert profiles</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="font-bold mb-2">Book Session</h3>
              <p className="text-gray-600">Select time & location</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
              <h3 className="font-bold mb-2">Start Training</h3>
              <p className="text-gray-600">Begin your improvement journey</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <div className="bg-blue-500 text-white text-center py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Ready to Improve Your Game?</h2>
          <p className="text-lg mb-8">
            Join hundreds of cricketers who have transformed their game with CricCoach
          </p>
          <Link to="/register">
            <button className="bg-white text-blue-500 font-semibold px-8 py-3 rounded-lg shadow-md hover:bg-gray-100 transition duration-300">
              Get Started Now
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;