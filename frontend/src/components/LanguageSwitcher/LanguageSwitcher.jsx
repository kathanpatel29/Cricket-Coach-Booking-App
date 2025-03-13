import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Button, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Tooltip
} from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import CheckIcon from '@mui/icons-material/Check';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  // Get available languages from environment variables or use defaults
  const availableLanguages = (import.meta.env.VITE_AVAILABLE_LANGUAGES || 'en,hi')
    .split(',')
    .map(lang => lang.trim());
  
  // Language names mapping
  const languageNames = {
    en: t('language.english'),
    hi: t('language.hindi')
  };
  
  // Language flags (can be replaced with actual flag icons)
  const languageFlags = {
    en: '🇬🇧',
    hi: '🇮🇳'
  };
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);
    handleClose();
  };
  
  const currentLanguage = i18n.language || 'en';
  
  return (
    <>
      <Tooltip title={t('language.changeLanguage')}>
        <Button
          color="inherit"
          onClick={handleClick}
          startIcon={<TranslateIcon />}
          aria-controls={open ? 'language-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          sx={{ minWidth: 'auto', textTransform: 'none' }}
        >
          {languageFlags[currentLanguage]}
        </Button>
      </Tooltip>
      
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'language-button',
        }}
      >
        {availableLanguages.map((language) => (
          <MenuItem 
            key={language} 
            onClick={() => changeLanguage(language)}
            selected={currentLanguage === language}
          >
            <ListItemIcon>
              {languageFlags[language]}
            </ListItemIcon>
            <ListItemText>{languageNames[language]}</ListItemText>
            {currentLanguage === language && <CheckIcon fontSize="small" />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher; 