import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EventIcon from '@mui/icons-material/Event';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { getApiByRole } from '../../services/api';

const PaymentHistory = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  
  const api = getApiByRole(user?.role);
  
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.getPaymentHistory();
        console.log('Payment history response:', response.data);
        
        let paymentsData = [];
        
        // Safely extract payments data from the response, ensuring it's an array
        if (response.data && response.data.status === 'success') {
          // Handle different possible response structures
          if (Array.isArray(response.data.data)) {
            paymentsData = response.data.data;
          } else if (response.data.data && Array.isArray(response.data.data.payments)) {
            paymentsData = response.data.data.payments;
          } else if (response.data.data && typeof response.data.data === 'object') {
            // If payments is an object with nested array
            if (Array.isArray(response.data.data.history)) {
              paymentsData = response.data.data.history;
            } else {
              // If it's some other object structure
              paymentsData = response.data.data;
            }
          }
        }
        
        // Process and transform the payment data to ensure all necessary fields exist
        const processedPayments = Array.isArray(paymentsData) 
          ? paymentsData.map(payment => {
              // Extract payment ID
              const paymentId = payment._id || payment.id || '';
              
              // Extract booking information
              const booking = payment.booking || {};
              
              // Extract coach information - improved logic to handle various data structures
              let coachName = '';
              let coachId = '';
              
              // Check direct coach name and ID on payment object
              if (payment.coachName) {
                coachName = payment.coachName;
                coachId = payment.coachId || '';
              }
              // Check for populated coach object
              else if (booking.coach) {
                if (typeof booking.coach === 'object') {
                  // Get coach ID
                  coachId = booking.coach._id || booking.coach.id || '';
                  
                  // Coach is a populated object
                  if (booking.coach.name) {
                    coachName = booking.coach.name;
                  } 
                  // Coach user object might contain name
                  else if (booking.coach.user) {
                    if (typeof booking.coach.user === 'object') {
                      coachName = booking.coach.user.name || '';
                      if (!coachId && (booking.coach.user._id || booking.coach.user.id)) {
                        coachId = booking.coach.user._id || booking.coach.user.id;
                      }
                    } else if (typeof booking.coach.user === 'string') {
                      coachId = booking.coach.user;
                    }
                  }
                  // Coach object might have firstname/lastname
                  else if (booking.coach.firstName || booking.coach.lastName) {
                    const firstName = booking.coach.firstName || '';
                    const lastName = booking.coach.lastName || '';
                    coachName = `${firstName} ${lastName}`.trim();
                  }
                } 
                // Coach is just an ID string
                else if (typeof booking.coach === 'string') {
                  coachId = booking.coach;
                }
              }
              // Try coach ID as a direct property
              else if (booking.coachId) {
                if (typeof booking.coachId === 'object') {
                  coachName = booking.coachId.name || '';
                  coachId = booking.coachId._id || booking.coachId.id || '';
                } else if (typeof booking.coachId === 'string') {
                  coachId = booking.coachId;
                }
              }
              
              // Format coach display with name and ID
              let formattedCoachInfo = 'N/A';
              if (coachName && coachId) {
                // Both name and ID are available
                formattedCoachInfo = `${coachName} (${coachId.substring(0, 8)})`;
              } else if (coachName) {
                // Only name is available
                formattedCoachInfo = coachName;
              } else if (coachId) {
                // Only ID is available
                formattedCoachInfo = `Coach (${coachId.substring(0, 8)})`;
              }
              
              // Extract payment amount
              const amount = payment.amount || booking.paymentAmount || 0;
              
              // Extract payment status
              const status = payment.status || booking.paymentStatus || 'unknown';
              
              // Extract payment method
              const paymentMethod = payment.paymentMethod || booking.paymentMethod || 'card';
              
              // Extract session date
              let sessionDate = null;
              if (booking.timeSlot) {
                if (typeof booking.timeSlot === 'object') {
                  sessionDate = booking.timeSlot.date || booking.timeSlot.startTime;
                } else if (typeof booking.timeSlot === 'string') {
                  // Try to extract date from a string reference
                  sessionDate = booking.timeSlot;
                }
              } else if (booking.date) {
                sessionDate = booking.date;
              } else if (booking.bookingDate) {
                sessionDate = booking.bookingDate;
              } else if (payment.sessionDate) {
                sessionDate = payment.sessionDate;
              }
              
              // Extract creation date
              const createdAt = payment.createdAt || payment.created || payment.date || booking.createdAt || new Date();
              
              // Add more detailed debugging
              console.log('Processing payment:', {
                id: paymentId,
                originalCoach: booking.coach,
                extractedCoachName: coachName,
                extractedCoachId: coachId,
                formattedCoachInfo: formattedCoachInfo,
                originalSessionDate: booking.timeSlot,
                extractedSessionDate: sessionDate
              });
              
              return {
                _id: paymentId,
                amount,
                status,
                paymentMethod,
                coachName: formattedCoachInfo,  // Now using the formatted coach info
                coachRawName: coachName,        // Store the raw name for search
                coachId,                       // Store the ID separately
                sessionDate,
                createdAt,
                originalPayment: payment // Keep the original data for reference
              };
          })
          : [];
        
        console.log('Processed payments:', processedPayments);
        
        setPayments(processedPayments);
        setFilteredPayments(processedPayments);
      } catch (err) {
        console.error('Error fetching payment history:', err);
        setError('Failed to load payment history. Please try again later.');
        setPayments([]);
        setFilteredPayments([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPayments();
  }, [api]);
  
  // Handle search
  useEffect(() => {
    if (!searchTerm.trim() || !Array.isArray(payments) || payments.length === 0) {
      setFilteredPayments(Array.isArray(payments) ? payments : []);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = payments.filter(payment => {
      // Safely check properties that might not exist
      const id = payment._id?.toLowerCase() || '';
      const coachName = payment.coachRawName?.toLowerCase() || '';  // Use raw name for search
      const coachId = payment.coachId?.toLowerCase() || '';         // Also search by coach ID
      const status = payment.status?.toLowerCase() || '';
      const paymentMethod = payment.paymentMethod?.toLowerCase() || '';
      
      return (
        id.includes(term) ||
        coachName.includes(term) ||
        coachId.includes(term) ||
        status.includes(term) ||
        paymentMethod.includes(term)
      );
    });
    
    setFilteredPayments(filtered);
  }, [searchTerm, payments]);
  
  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Format amount
  const formatAmount = (amount) => {
    return typeof amount === 'number' ? `CAD $${amount.toFixed(2)}` : `CAD $0.00`;
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.log('Date formatting error:', error, 'for date:', dateString);
      return 'Invalid date';
    }
  };
  
  // Generate payment receipt (placeholder function)
  const handleDownloadReceipt = (paymentId) => {
    // In a real app, this would generate and download a PDF receipt
    console.log(`Downloading receipt for payment ${paymentId}`);
    alert(`Receipt for payment ${paymentId} would be downloaded in a real app.`);
  };
  
  // Ensure filteredPayments is always an array
  const safeFilteredPayments = Array.isArray(filteredPayments) ? filteredPayments : [];
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Payment History
          </Typography>
          
          <TextField
            placeholder="Search payments..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {safeFilteredPayments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No payment records found.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Payment ID</TableCell>
                    <TableCell>Payment Date</TableCell>
                    <TableCell>Coach</TableCell>
                    <TableCell>Session Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {safeFilteredPayments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((payment, index) => (
                      <TableRow key={payment?._id || index} hover>
                        <TableCell component="th" scope="row">
                          {payment?._id ? payment._id.substring(0, 8) + '...' : 'N/A'}
                        </TableCell>
                        <TableCell>{formatDate(payment?.createdAt)}</TableCell>
                        <TableCell>{payment?.coachName || 'N/A'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            {formatDate(payment?.sessionDate)}
                          </Box>
                        </TableCell>
                        <TableCell>{formatAmount(payment?.amount)}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>
                          {payment?.paymentMethod || 'Card'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={(payment?.status || 'Unknown').toUpperCase()}
                            color={
                              payment?.status === 'completed' || payment?.status === 'paid' ? 'success' :
                              payment?.status === 'refunded' ? 'warning' :
                              payment?.status === 'failed' ? 'error' :
                              payment?.status === 'pending' ? 'info' :
                              'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<ReceiptIcon />}
                            onClick={() => handleDownloadReceipt(payment?._id)}
                            disabled={payment?.status !== 'completed' && payment?.status !== 'paid'}
                          >
                            Receipt
                          </Button>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={safeFilteredPayments.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Container>
  );
};

export default PaymentHistory;
