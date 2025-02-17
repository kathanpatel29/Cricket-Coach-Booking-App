import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={i18n.language === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
      >
        English
      </button>
      <button
        onClick={() => i18n.changeLanguage('hi')}
        className={i18n.language === 'hi' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
      >
        हिंदी
      </button>
    </div>
  );
};

export default LanguageSwitcher; 