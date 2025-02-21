import Home from '../pages/Home';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import About from '../pages/info/About';
import Contact from '../pages/info/Contact';
import FAQ from '../pages/info/FAQ';
import CoachList from '../components/coaches/CoachList';
import CoachProfile from '../components/coaches/CoachProfile';

export const publicRoutes = [
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/about',
    element: <About />
  },
  {
    path: '/contact',
    element: <Contact />
  },
  {
    path: '/faq',
    element: <FAQ />
  },
  {
    path: '/coaches',
    element: <CoachList />
  },
  {
    path: '/coaches/:id',
    element: <CoachProfile />
  }
];