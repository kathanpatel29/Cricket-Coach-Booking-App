import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tab,
  Tabs,
  CircularProgress,
  Alert
} from '@mui/material';
import ReviewList from './ReviewList';
import ReviewStats from './ReviewStats';
import { reviewService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CoachReviews = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviewStats();
  }, []);

  const fetchReviewStats = async () => {
    try {
      setLoading(true);
      const response = await reviewService.getReviewStats(user._id);
      if (response?.data?.data) {
        setStats(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching review statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box p={3}>
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="All Reviews" />
        </Tabs>

        {activeTab === 0 ? (
          <Box p={3}>
            <ReviewStats stats={stats} />
          </Box>
        ) : (
          <Box p={3}>
            <ReviewList coachId={user._id} showPagination={true} />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CoachReviews; 