import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { coachService } from '../../services/api';
import { formatDateTime } from '../../utils/dateUtils';
import { toast } from 'react-hot-toast';

const Sessions = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [notesDialog, setNotesDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  useEffect(() => {
    fetchSessions();
  }, [activeTab]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const status = activeTab === 0 ? 'upcoming' : activeTab === 1 ? 'completed' : 'cancelled';
      const response = await coachService.getSessions(status);
      console.log(response);
      if (response?.data?.data) {
        setSessions(response.data.data.sessions);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAddNotes = (session) => {
    setSelectedSession(session);
    setSessionNotes(session.notes || '');
    setNotesDialog(true);
  };

  const handleSaveNotes = async () => {
    try {
      setLoading(true);
      const response = await coachService.updateSessionNotes(selectedSession._id, {
        notes: sessionNotes
      });

      if (response?.data?.status === 'success') {
        toast.success('Session notes updated successfully');
        setNotesDialog(false);
        fetchSessions();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating session notes');
      toast.error('Failed to update session notes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Coaching Sessions
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="Upcoming" />
          <Tab label="Completed" />
          <Tab label="Cancelled" />
        </Tabs>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : sessions.length > 0 ? (
          <Stack spacing={2}>
            {sessions.map((session) => (
              <Paper key={session._id} variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarIcon color="primary" />
                      <Typography>
                        {formatDateTime(session.date)}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TimeIcon color="primary" />
                      <Typography>
                        Duration: {session.duration} minutes
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon color="primary" />
                      <Typography>
                        User: {session.user.name}
                      </Typography>
                    </Box>
                    {session.notes && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <NotesIcon color="primary" />
                        <Typography>
                          Notes: {session.notes}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  <Box>
                    <Chip
                      label={session.status}
                      color={getStatusColor(session.status)}
                      sx={{ mb: 1 }}
                    />
                    {session.status === 'completed' && (
                      <Button
                        size="small"
                        onClick={() => handleAddNotes(session)}
                        startIcon={<NotesIcon />}
                      >
                        {session.notes ? 'Edit Notes' : 'Add Notes'}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Alert severity="info">
            No {activeTab === 0 ? 'upcoming' : activeTab === 1 ? 'completed' : 'cancelled'} sessions found
          </Alert>
        )}
      </Paper>

      {/* Session Notes Dialog */}
      <Dialog
        open={notesDialog}
        onClose={() => setNotesDialog(false)}
        maxWidth="sm"
        fullWidth
      >
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
          <Button onClick={() => setNotesDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveNotes}
            variant="contained"
            disabled={!sessionNotes.trim()}
          >
            Save Notes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sessions; 