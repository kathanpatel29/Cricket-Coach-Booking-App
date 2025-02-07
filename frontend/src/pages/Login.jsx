import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await login(email, password);
      
      switch (res.user.role) {
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "coach":
          navigate("/coach-dashboard");
          break;
        case "user":
          navigate("/dashboard");
          break;
        default:
          navigate("/dashboard");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleLogin} className="p-8 border rounded-lg shadow-md bg-white w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h1>
        
        <div className="space-y-4">
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
              placeholder="Enter your password" 
              className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="bg-primary text-white px-6 py-2 rounded-md mt-6 w-full hover:bg-primary-dark transition-colors duration-200"
        >
          Login
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-600">Don't have an account?</p>
          <button 
            type="button" 
            onClick={() => navigate('/register')} 
            className="text-primary hover:underline mt-2 font-medium"
          >
            Register here
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
