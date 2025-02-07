import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [adminKey, setAdminKey] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/auth/register", { name, email, password, role, admin_secret_key: adminKey });
      navigate("/login");
    } catch (error) {
      alert(error.response.data.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleRegister} className="p-8 border rounded-lg shadow-md bg-white w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Register</h1>
        
        <div className="space-y-4">
          <div className="flex flex-col">
            <label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input 
              id="name"
              type="text" 
              placeholder="Enter your full name" 
              className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input 
              id="email"
              type="email" 
              placeholder="Enter your email" 
              className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input 
              id="password"
              type="password" 
              placeholder="Create a password" 
              className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="role" className="text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select 
              id="role"
              className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="client">Client</option>
              <option value="coach">Coach</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {role === "admin" && (
            <div className="flex flex-col">
              <label htmlFor="adminKey" className="text-sm font-medium text-gray-700 mb-1">
                Admin Secret Key
              </label>
              <input 
                id="adminKey"
                type="text" 
                placeholder="Enter admin secret key" 
                className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
                value={adminKey} 
                onChange={(e) => setAdminKey(e.target.value)} 
              />
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="bg-primary text-white px-6 py-2 rounded-md mt-6 w-full hover:bg-primary-dark transition-colors duration-200"
        >
          Register
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-600">Already have an account?</p>
          <button 
            type="button" 
            onClick={() => navigate('/login')} 
            className="text-primary hover:underline mt-2 font-medium"
          >
            Login here
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;
