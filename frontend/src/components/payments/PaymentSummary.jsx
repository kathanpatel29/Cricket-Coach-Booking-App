import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { CURRENCY } from '../../utils/constants';
import { formatDateTime } from '../../utils/dateUtils';

const PaymentSummary = ({ booking }) => {
  const calculateSubtotal = () => booking.amount;
  const calculateTax = () => booking.amount * 0.13; // 13% HST for Ontario
  const calculateTotal = () => calculateSubtotal() + calculateTax();

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Payment Summary
      </Typography>

      <List disablePadding>
        <ListItem>
          <ListItemText
            primary="Session Details"
            secondary={
              <>
                <Typography variant="body2" color="text.secondary">
                  Date: {formatDateTime(booking.date)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duration: {booking.duration} minutes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Coach: {booking.coach.name}
                </Typography>
              </>
            }
          />
        </ListItem>

        <Divider />

        <ListItem>
          <ListItemText primary="Subtotal" />
          <Typography>
            {CURRENCY.format(calculateSubtotal())}
          </Typography>
        </ListItem>

        <ListItem>
          <ListItemText 
            primary="HST (13%)"
            secondary="Tax Registration #: 123456789 RT0001"
          />
          <Typography>
            {CURRENCY.format(calculateTax())}
          </Typography>
        </ListItem>

        <Divider />

        <ListItem>
          <ListItemText
            primary={
              <Typography variant="h6">
                Total
              </Typography>
            }
          />
          <Typography variant="h6" color="primary">
            {CURRENCY.format(calculateTotal())}
          </Typography>
        </ListItem>
      </List>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          * All prices are in Canadian Dollars (CAD)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          * Payment is processed securely through our payment provider
        </Typography>
        <Typography variant="body2" color="text.secondary">
          * Cancellation policy applies as per our terms of service
        </Typography>
      </Box>
    </Paper>
  );
};

export default PaymentSummary; 