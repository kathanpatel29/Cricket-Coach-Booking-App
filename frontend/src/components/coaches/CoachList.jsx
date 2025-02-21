import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { publicService } from '../../services/api';
import CoachCard from './CoachCard';
import { useAuth } from '../../contexts/AuthContext';

const CoachList = ({ onBookSession }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    specialization: '',
    priceRange: '',
    experience: '',
    availabilityFilter: 'all'
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCoaches();
  }, [filters, page]);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const response = await publicService.getAllCoaches({
        ...filters,
        page,
        approved: true,
      });

      setCoaches(response.data.coaches);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      setError('Failed to fetch coaches');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const renderAvailabilityFilter = () => (
    <Grid item xs={12} sm={6} md={3}>
      <FormControl fullWidth>
        <InputLabel>Availability</InputLabel>
        <Select
          name="availabilityFilter"
          value={filters.availabilityFilter}
          onChange={handleFilterChange}
          label="Availability"
        >
          <MenuItem value="all">All Coaches</MenuItem>
          <MenuItem value="available">Available for Booking</MenuItem>
        </Select>
      </FormControl>
    </Grid>
  );

  if (isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!coaches || coaches.length === 0) {
    return (
      <Box m={2}>
        <Alert severity="info">No coaches available matching your criteria.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            name="search"
            placeholder="Search coaches..."
            value={filters.search}
            onChange={handleFilterChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Specialization</InputLabel>
            <Select
              name="specialization"
              value={filters.specialization}
              onChange={handleFilterChange}
              label="Specialization"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="batting">Batting</MenuItem>
              <MenuItem value="bowling">Bowling</MenuItem>
              <MenuItem value="fielding">Fielding</MenuItem>
              <MenuItem value="wicket-keeping">Wicket Keeping</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Price Range</InputLabel>
            <Select
              name="priceRange"
              value={filters.priceRange}
              onChange={handleFilterChange}
              label="Price Range"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="0-50">$0 - $50</MenuItem>
              <MenuItem value="51-100">$51 - $100</MenuItem>
              <MenuItem value="101+">$101+</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Experience</InputLabel>
            <Select
              name="experience"
              value={filters.experience}
              onChange={handleFilterChange}
              label="Experience"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="0-2">0-2 years</MenuItem>
              <MenuItem value="3-5">3-5 years</MenuItem>
              <MenuItem value="5+">5+ years</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {renderAvailabilityFilter()}
      </Grid>

      {/* Coach Cards */}
      <Grid container spacing={3}>
        {coaches.map((coach) => (
          <Grid item xs={12} sm={6} md={4} key={coach._id}>
            <CoachCard coach={coach} onBookSession={onBookSession} />
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default CoachList; 