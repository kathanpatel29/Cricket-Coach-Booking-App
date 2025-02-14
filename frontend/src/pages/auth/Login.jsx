import { useState, useContext, useEffect } from "react"; // Add useEffect here
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../contexts/AuthContext";
import Alert from "../../components/common/Alert";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    adminSecretKey: "",
  });
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.email) {
      setFormData(prev => ({
        ...prev,
        email: location.state.email
      }));
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Check if email is for admin
      if (formData.email.toLowerCase().includes('admin')) {
        setShowAdminKey(true);
        if (!formData.adminSecretKey) {
          setError('Admin secret key is required');
          return;
        }
      }

      const loginData = {
        email: formData.email,
        password: formData.password,
        ...(showAdminKey && { adminSecretKey: formData.adminSecretKey })
      };

      const user = await login(loginData);
      
      // Navigate based on user role
      switch (user.role) {
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "coach":
          navigate("/coach/dashboard");
          break;
        default:
          navigate("/dashboard");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        {error && <Alert type="error" message={error} />}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                value={formData.email}
                onChange={handleChange}
                onBlur={(e) => {
                  if (e.target.value.toLowerCase().includes('admin')) {
                    setShowAdminKey(true);
                  } else {
                    setShowAdminKey(false);
                  }
                }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {showAdminKey && (
              <div>
                <label htmlFor="adminSecretKey" className="block text-sm font-medium text-gray-700">
                  Admin Secret Key
                </label>
                <input
                  id="adminSecretKey"
                  name="adminSecretKey"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={formData.adminSecretKey}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;