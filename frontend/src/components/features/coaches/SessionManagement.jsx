import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { coachService } from '../../../services/api';
import SessionFeedback from './SessionFeedback';

const SessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [sessionDialog, setSessionDialog] = useState({
    open: false,
    session: null,
    action: null
  });
  const [feedbackDialog, setFeedbackDialog] = useState({
    open: false,
    sessionId: null
  });
  const [notes, setNotes] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchSessions();
  }, [activeTab]);

  const fetchSessions = async () => {
    try {
      const status = activeTab === 0 ? 'upcoming' : activeTab === 1 ? 'completed' : 'cancelled';
      const response = await coachService.getSessions({ status });
      if (response?.data?.sessions) {
        setSessions(response.data.sessions);
      } else {
        setSessions([]);
        setError('No sessions data available');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError(error.response?.data?.message || 'Error fetching sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionAction = async () => {
    try {
      await coachService.updateSession(sessionDialog.session._id, {
        status: sessionDialog.action,
        notes
      });
      
      // Send notification email based on action
      if (sessionDialog.action === 'completed' || sessionDialog.action === 'cancelled') {
        await coachService.sendSessionNotification(sessionDialog.session._id, {
          type: sessionDialog.action,
          notes
        });
      }

      await fetchSessions();
      setSessionDialog({ open: false, session: null, action: null });
      setNotes('');

      // Show feedback dialog for completed sessions if user is a client
      if (sessionDialog.action === 'completed' && user.role === 'client') {
        setFeedbackDialog({
          open: true,
          sessionId: sessionDialog.session._id
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating session');
    }
  };

  const handleFeedbackSubmit = async () => {
    setFeedbackDialog({ open: false, sessionId: null });
    await fetchSessions();
  };

  const openSessionDialog = (session, action) => {
    setSessionDialog({
      open: true,
      session,
      action
    });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="Upcoming" />
          <Tab label="Completed" />
          <Tab label="Cancelled" />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {sessions && sessions.length > 0 ? (
          sessions.map((session) => (
            <Grid item xs={12} md={6} key={session._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1">
                      Session with {user?.role === 'client' ? session?.coach?.name || 'Unknown Coach' : session?.client?.name || 'Unknown Client'}
                    </Typography>
                    <Chip
                      label={session.status || 'Unknown'}
                      color={getStatusColor(session.status)}
                    />
                  </Box>

                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Date: {session.date ? new Date(session.date).toLocaleDateString() : 'Not specified'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Time: {session.date ? new Date(session.date).toLocaleTimeString() : 'Not specified'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Duration: {session.duration || 0} minutes
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Location: {session.location || 'Not specified'}
                  </Typography>

                  {session.notes && (
                    <Box mt={2}>
                      <Typography variant="subtitle2">Notes:</Typography>
                      <Typography variant="body2">{session.notes}</Typography>
                    </Box>
                  )}

                  {session.feedback && user?.role === 'coach' && (
                    <Box mt={2}>
                      <Typography variant="subtitle2">Client Feedback:</Typography>
                      <Box display="flex" alignItems="center" mt={1}>
                        <Typography variant="body2" mr={1}>Rating:</Typography>
                        <Rating value={session.feedback.rating || 0} readOnly size="small" />
                      </Box>
                      {session.feedback.comment && (
                        <Typography variant="body2" mt={1}>{session.feedback.comment}</Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  {session.status === 'upcoming' && (
                    <>
                      {user?.role === 'coach' && (
                        <Button
                          color="primary"
                          onClick={() => openSessionDialog(session, 'completed')}
                        >
                          Mark Complete
                        </Button>
                      )}
                      <Button
                        color="error"
                        onClick={() => openSessionDialog(session, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {session.status === 'completed' && (
                    <>
                      {user?.role === 'coach' && (
                        <Button
                          color="primary"
                          onClick={() => openSessionDialog(session, 'addNotes')}
                        >
                          Add Notes
                        </Button>
                      )}
                      {user?.role === 'client' && !session.feedback && (
                        <Button
                          color="primary"
                          onClick={() => setFeedbackDialog({ open: true, sessionId: session._id })}
                        >
                          Provide Feedback
                        </Button>
                      )}
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No {activeTab === 0 ? 'upcoming' : activeTab === 1 ? 'completed' : 'cancelled'} sessions found
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Session Action Dialog */}
      <Dialog
        open={sessionDialog.open}
        onClose={() => setSessionDialog({ open: false, session: null, action: null })}
      >
        <DialogTitle>
          {sessionDialog.action === 'completed'
            ? 'Complete Session'
            : sessionDialog.action === 'cancelled'
            ? 'Cancel Session'
            : 'Add Session Notes'}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {sessionDialog.action === 'completed'
              ? 'Are you sure you want to mark this session as completed?'
              : sessionDialog.action === 'cancelled'
              ? 'Are you sure you want to cancel this session?'
              : 'Add notes for this session'}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            margin="normal"
            placeholder={
              sessionDialog.action === 'completed'
                ? 'Add any session notes'
                : sessionDialog.action === 'cancelled'
                ? 'Provide a reason for cancellation'
                : 'Add session notes'
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSessionDialog({ open: false, session: null, action: null })}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSessionAction}
            variant="contained"
            color={sessionDialog.action === 'cancelled' ? 'error' : 'primary'}
          >
            {sessionDialog.action === 'completed'
              ? 'Complete'
              : sessionDialog.action === 'cancelled'
              ? 'Cancel Session'
              : 'Save Notes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <SessionFeedback
        open={feedbackDialog.open}
        sessionId={feedbackDialog.sessionId}
        onClose={() => setFeedbackDialog({ open: false, sessionId: null })}
        onSubmit={handleFeedbackSubmit}
      />
    </Box>
  );
};

export default SessionManagement; 