import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Common
      'welcome': 'Welcome to Cricket Coach Booking',
      'login': 'Login',
      'signup': 'Sign Up',
      'logout': 'Logout',
      'profile': 'Profile',
      
      // Booking
      'book_session': 'Book a Session',
      'available_coaches': 'Available Coaches',
      'select_date': 'Select Date',
      'select_time': 'Select Time',
      'booking_confirmation': 'Booking Confirmation',
      'payment': 'Payment',
      
      // Coach
      'coach_profile': 'Coach Profile',
      'experience': 'Experience',
      'specialization': 'Specialization',
      'ratings': 'Ratings',
      'reviews': 'Reviews',
      
      // Admin
      'admin_dashboard': 'Admin Dashboard',
      'manage_users': 'Manage Users',
      'manage_coaches': 'Manage Coaches',
      'reports': 'Reports'
    }
  },
  hi: {
    translation: {
      // Common
      'welcome': 'क्रिकेट कोच बुकिंग में आपका स्वागत है',
      'login': 'लॉग इन',
      'signup': 'साइन अप',
      'logout': 'लॉग आउट',
      'profile': 'प्रोफ़ाइल',
      
      // Booking
      'book_session': 'सत्र बुक करें',
      'available_coaches': 'उपलब्ध कोच',
      'select_date': 'तारीख चुनें',
      'select_time': 'समय चुनें',
      'booking_confirmation': 'बुकिंग की पुष्टि',
      'payment': 'भुगतान',
      
      // Coach
      'coach_profile': 'कोच प्रोफ़ाइल',
      'experience': 'अनुभव',
      'specialization': 'विशेषज्ञता',
      'ratings': 'रेटिंग',
      'reviews': 'समीक्षाएं',
      
      // Admin
      'admin_dashboard': 'एडमिन डैशबोर्ड',
      'manage_users': 'उपयोगकर्ता प्रबंधन',
      'manage_coaches': 'कोच प्रबंधन',
      'reports': 'रिपोर्ट'
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n; 