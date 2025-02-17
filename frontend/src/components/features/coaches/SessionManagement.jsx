import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TablePagination
} from '@mui/material';
import { coachService } from '../../../services/api';
import { format } from 'date-fns';

const SessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await coachService.getBookings();
      setSessions(response.data.data.bookings);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await coachService.updateBookingStatus(bookingId, newStatus);
      fetchSessions(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating session status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      completed: 'success',
      cancelled: 'error',
      'no-show': 'error'
    };
    return colors[status] || 'default';
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Session Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((session) => (
                <TableRow key={session._id}>
                  <TableCell>
                    {format(new Date(session.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{session.timeSlot}</TableCell>
                  <TableCell>
                    {session.client.name}
                    <br />
                    <Typography variant="caption" color="textSecondary">
                      {session.client.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={session.status} 
                      color={getStatusColor(session.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {session.status === 'pending' && (
                      <>
                        <Button
                          size="small"
                          color="primary"
                          onClick={() => handleStatusChange(session._id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleStatusChange(session._id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {session.status === 'confirmed' && (
                      <>
                        <Button
                          size="small"
                          color="success"
                          onClick={() => handleStatusChange(session._id, 'completed')}
                        >
                          Complete
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleStatusChange(session._id, 'no-show')}
                        >
                          No Show
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div"
        count={sessions.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default SessionManagement; 