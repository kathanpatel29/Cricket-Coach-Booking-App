import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const Reports = () => {
  const [report, setReport] = useState({});

  useEffect(() => {
    axios.get("/api/reports/summary").then((res) => setReport(res.data));
  }, []);

  return (
    <div>
      <Navbar />
      <div className="max-w-5xl mx-auto mt-10 p-6 border rounded">
        <h1 className="text-2xl font-bold">Admin Reports</h1>

        <h2 className="mt-6 text-xl font-bold">Summary</h2>
        <p><strong>Total Users:</strong> {report.totalUsers}</p>
        <p><strong>Total Coaches:</strong> {report.totalCoaches}</p>
        <p><strong>Total Bookings:</strong> {report.totalBookings}</p>
        <p><strong>Total Revenue:</strong> ${report.totalRevenue}</p>
      </div>
    </div>
  );
};

export default Reports;
