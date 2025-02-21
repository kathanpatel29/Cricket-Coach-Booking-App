import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { adminService } from '../../services/api';
import { formatDateTime } from '../../utils/dateUtils';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllBookings();
      if (response?.data?.data?.bookings) {
        setBookings(response.data.data.bookings);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await adminService.updateBooking(bookingId, { status: newStatus });
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating booking status');
    }
  };

  const handleProcessRefund = async (bookingId) => {
    try {
      await adminService.processRefund(bookingId);
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing refund');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Booking ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Coach</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking._id}>
                <TableCell>{booking._id}</TableCell>
                <TableCell>{booking.user.name}</TableCell>
                <TableCell>{booking.coach.name}</TableCell>
                <TableCell>{formatDateTime(booking.date)}</TableCell>
                <TableCell>{booking.status}</TableCell>
                <TableCell>${booking.amount}</TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => {
                      setSelectedBooking(booking);
                      setViewDialog(true);
                    }} 
                    size="small"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => {
                      setSelectedBooking(booking);
                      setEditDialog(true);
                    }} 
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Booking Details</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1">User Information</Typography>
              <Typography>Name: {selectedBooking.user.name}</Typography>
              <Typography>Email: {selectedBooking.user.email}</Typography>
              
              <Typography variant="subtitle1" sx={{ mt: 2 }}>Coach Information</Typography>
              <Typography>Name: {selectedBooking.coach.name}</Typography>
              <Typography>Email: {selectedBooking.coach.email}</Typography>
              
              <Typography variant="subtitle1" sx={{ mt: 2 }}>Booking Details</Typography>
              <Typography>Date: {formatDateTime(selectedBooking.date)}</Typography>
              <Typography>Status: {selectedBooking.status}</Typography>
              <Typography>Amount: ${selectedBooking.amount}</Typography>
              
              {selectedBooking.notes && (
                <>
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>Notes</Typography>
                  <Typography>{selectedBooking.notes}</Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
        <DialogTitle>Update Booking Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedBooking?.status || ''}
                onChange={(e) => handleUpdateStatus(selectedBooking._id, e.target.value)}
                label="Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            
            {selectedBooking?.status === 'cancelled' && !selectedBooking?.refunded && (
              <Button
                onClick={() => handleProcessRefund(selectedBooking._id)}
                color="primary"
                variant="contained"
                sx={{ mt: 2 }}
              >
                Process Refund
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookingManagement; 