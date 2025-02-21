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
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Cancel as CancelIcon,
  Check as CompleteIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { coachService } from '../../services/api';
import { formatDateTime } from '../../utils/dateUtils';

const SessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [notesDialog, setNotesDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await coachService.getCoachSessions();
      if (response?.data?.data?.sessions) {
        setSessions(response.data.data.sessions);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (sessionId, status) => {
    try {
      await coachService.updateSessionStatus(sessionId, status);
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating session status');
    }
  };

  const handleSaveNotes = async () => {
    try {
      await coachService.updateSessionNotes(selectedSession._id, sessionNotes);
      setNotesDialog(false);
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving session notes');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
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
              <TableCell>Date & Time</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session._id}>
                <TableCell>{formatDateTime(session.date)}</TableCell>
                <TableCell>{session.user.name}</TableCell>
                <TableCell>{session.duration} minutes</TableCell>
                <TableCell>
                  <Chip
                    label={session.status}
                    color={getStatusColor(session.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => {
                      setSelectedSession(session);
                      setSessionNotes(session.notes || '');
                      setNotesDialog(true);
                    }}
                    size="small"
                  >
                    <NotesIcon />
                  </IconButton>
                  {session.status === 'scheduled' && (
                    <>
                      <IconButton
                        onClick={() => handleUpdateStatus(session._id, 'completed')}
                        color="success"
                        size="small"
                      >
                        <CompleteIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleUpdateStatus(session._id, 'cancelled')}
                        color="error"
                        size="small"
                      >
                        <CancelIcon />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Notes Dialog */}
      <Dialog open={notesDialog} onClose={() => setNotesDialog(false)}>
        <DialogTitle>Session Notes</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="Enter session notes..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveNotes} variant="contained">
            Save Notes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionManagement; 