// Token management
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

// User data management
export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const removeUser = () => {
  localStorage.removeItem('user');
};

// Auth state management
export const isAuthenticated = () => {
  return !!getToken();
};

export const logout = () => {
  removeToken();
  removeUser();
  window.localStorage.setItem('logout', Date.now().toString());
};

// Role-based access control
export const hasRole = (requiredRole) => {
  const user = getUser();
  return user?.role === requiredRole;
};

export const hasPermission = (requiredPermission) => {
  const user = getUser();
  return user?.permissions?.includes(requiredPermission);
}; 

export const handleLogout = () => {
    logout();
    window.location.href = '/login'; 
  };