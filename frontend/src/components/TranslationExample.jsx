import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Grid, 
  Card, 
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';

const TranslationExample = () => {
  const { t } = useTranslation();
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('app.name')} - {t('language.changeLanguage')}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {t('app.tagline')}
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title={t('coach.title')} />
              <CardContent>
                <Typography variant="body2">
                  {t('coach.findCoach')}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">
                    {t('coach.specializations')}:
                  </Typography>
                  <ul>
                    <li>{t('coach.batting')}</li>
                    <li>{t('coach.bowling')}</li>
                    <li>{t('coach.fielding')}</li>
                    <li>{t('coach.wicketKeeping')}</li>
                  </ul>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title={t('booking.title')} />
              <CardContent>
                <Typography variant="body2">
                  {t('booking.bookSession')}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">
                    {t('booking.status')}:
                  </Typography>
                  <ul>
                    <li>{t('booking.pending')}</li>
                    <li>{t('booking.confirmed')}</li>
                    <li>{t('booking.cancelled')}</li>
                    <li>{t('booking.completed')}</li>
                  </ul>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default TranslationExample; 