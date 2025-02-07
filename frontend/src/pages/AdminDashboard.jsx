import { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [pendingCoaches, setPendingCoaches] = useState([]);

  useEffect(() => {
    axios.get("/api/auth/admin/stats").then((res) => setStats(res.data));
    axios.get("/api/auth/admin/users").then((res) => setUsers(res.data));
    axios.get("/api/coaches/pendingCoaches").then((res) => setPendingCoaches(res.data));
  }, []);

  const deleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await axios.delete(`/api/auth/admin/users/${id}`);
      setUsers(users.filter((user) => user._id !== id));
    }
  };

  const approveCoach = async (id) => {
    try {
      await axios.patch(`/api/coaches/${id}/approve`);
      const pendingResponse = await axios.get("/api/coaches/pendingCoaches");
      setPendingCoaches(pendingResponse.data);
      const statsResponse = await axios.get("/api/auth/admin/stats");
      setStats(statsResponse.data);
    } catch (error) {
      console.error("Error approving coach:", error);
      alert("Failed to approve coach. Please try again.");
    }
  };
  
  const rejectCoach = async (id) => {
    try {
      if (window.confirm("Are you sure you want to reject this coach application?")) {
        await axios.patch(`/api/coaches/${id}/reject`);
        const pendingResponse = await axios.get("/api/coaches/pendingCoaches");
        setPendingCoaches(pendingResponse.data);
      }
    } catch (error) {
      console.error("Error rejecting coach:", error);
      alert("Failed to reject coach. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-semibold text-gray-800 mb-8">Admin Dashboard</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Users</h3>
            <p className="text-2xl font-semibold text-gray-800">{stats.totalUsers || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Coaches</h3>
            <p className="text-2xl font-semibold text-gray-800">{stats.totalCoaches || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Bookings</h3>
            <p className="text-2xl font-semibold text-gray-800">{stats.totalBookings || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Revenue</h3>
            <p className="text-2xl font-semibold text-gray-800">${stats.revenue || 0}</p>
          </div>
        </div>

        {/* Pending Coaches Section */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Pending Coach Approvals</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingCoaches.map((coach) => (
              <div key={coach._id} className="p-6 flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">{coach.name}</h3>
                  <p className="text-gray-600">{coach.email}</p>
                  <div className="text-sm text-gray-500">
                    <p>Specialization: {coach.specialization}</p>
                    <p>Experience: {coach.experience}</p>
                  </div>
                </div>
                <div className="space-x-3">
                  <button 
                    onClick={() => approveCoach(coach._id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => rejectCoach(coach._id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingCoaches.length === 0 && (
              <p className="p-6 text-gray-500 text-center">No pending coach applications</p>
            )}
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {users.map((user) => (
              <div key={user._id} className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">{user.name}</h3>
                  <p className="text-gray-600 text-sm">{user.email}</p>
                </div>
                <button 
                  onClick={() => deleteUser(user._id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            ))}
            {users.length === 0 && (
              <p className="p-6 text-gray-500 text-center">No users found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;