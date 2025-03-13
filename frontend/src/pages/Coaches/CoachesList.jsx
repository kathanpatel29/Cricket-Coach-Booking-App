import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Avatar, 
  Chip, 
  TextField, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Select,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Pagination
} from '@mui/material';
import { Link } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SportsCricketIcon from '@mui/icons-material/SportsCricket';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { publicApi } from '../../services/api';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays } from 'date-fns';

const CoachesList = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('experience');
  const [availabilityDate, setAvailabilityDate] = useState(null);

  // Available specializations for filter
  const specializationOptions = [
    'Batting',
    'Bowling',
    'Fielding',
    'Wicket-keeping',
    'Game Strategy',
    'Mental Conditioning',
    'Physical Fitness',
    'Fast Bowling',
    'Spin Bowling',
    'Power Hitting',
    'Defensive Batting'
  ];

  // Price range options
  const priceRangeOptions = [
    { value: '', label: 'Any Price' },
    { value: '0-50', label: 'Under $50/hr' },
    { value: '50-100', label: 'From $50 to $100/hr' },
    { value: '100+', label: 'Over $100/hr' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'priceAsc', label: 'Price: Low to High' },
    { value: 'priceDesc', label: 'Price: High to Low' },
    { value: 'experience', label: 'Most Experienced' }
  ];

  // Fetch coaches from API
  const fetchCoaches = async () => {
    try {
      setLoading(true);
      
      // Construct query parameters
      let params = { page, limit: 9 };
      
      if (searchTerm) params.search = searchTerm;
      if (specialization) params.specialization = specialization;
      
      // Handle price range filtering
      if (priceRange) {
        const [min, max] = priceRange.split('-');
        if (min) params.minPrice = min;
        if (max) params.maxPrice = max;
      }
      
      // Handle availability date filtering
      if (availabilityDate) {
        params.availableOn = format(availabilityDate, 'yyyy-MM-dd');
      }
      
      // Handle sorting
      if (sortBy) {
        switch (sortBy) {
          case 'priceAsc':
            params.sort = 'hourlyRate';
            params.order = 'asc';
            break;
          case 'priceDesc':
            params.sort = 'hourlyRate';
            params.order = 'desc';
            break;
          case 'experience':
            params.sort = 'experience';
            params.order = 'desc';
            break;
          default:
            params.sort = 'experience';
            params.order = 'desc';
        }
      }
      
      const response = await publicApi.getAllCoaches(params);
      
      // Handle API response
      if (response.data && response.data.status === 'success') {
        setCoaches(response.data.data.coaches || []);
        setTotalPages(response.data.data.pagination?.totalPages || 1);
      } else {
        setError('Failed to fetch coaches. Please try again.');
        setCoaches([]);
      }
    } catch (err) {
      console.error('Error fetching coaches:', err);
      setError('An error occurred while fetching coaches. Please try again later.');
      setCoaches([]);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch coaches when filters or pagination changes
  useEffect(() => {
    fetchCoaches();
  }, [page, specialization, priceRange, sortBy, availabilityDate]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchCoaches();
  };

  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Handle filter changes
  const handleSpecializationChange = (e) => {
    setSpecialization(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handlePriceRangeChange = (e) => {
    setPriceRange(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1); // Reset to first page when sort changes
  };
  
  const handleDateChange = (date) => {
    setAvailabilityDate(date);
    setPage(1); // Reset to first page when date changes
  };
  
  const clearDate = () => {
    setAvailabilityDate(null);
    setPage(1);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Find Cricket Coaches
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse our selection of professional cricket coaches and book your session today.
          </Typography>
        </Box>

        {/* Search and Filter Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="flex-end">
            {/* Search Bar */}
            <Grid item xs={12} md={4}>
              <form onSubmit={handleSearch}>
                <TextField
                  fullWidth
                  label="Search Coaches"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton type="submit" edge="end">
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </form>
            </Grid>

            {/* Date Availability Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Available On Date"
                value={availabilityDate}
                onChange={handleDateChange}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    fullWidth 
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonthIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: availabilityDate ? (
                        <InputAdornment position="end">
                          <IconButton 
                            onClick={(e) => {
                              e.stopPropagation();
                              clearDate();
                            }}
                            edge="end"
                            size="small"
                          >
                            ✕
                          </IconButton>
                        </InputAdornment>
                      ) : null
                    }}
                  />
                )}
                minDate={new Date()}
                maxDate={addDays(new Date(), 30)}
              />
            </Grid>

            {/* Specialization Filter */}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="specialization-label">Specialization</InputLabel>
                <Select
                  labelId="specialization-label"
                  id="specialization-select"
                  value={specialization}
                  onChange={handleSpecializationChange}
                  label="Specialization"
                >
                  <MenuItem value="">Any Specialization</MenuItem>
                  {specializationOptions.map((option) => (
                    <MenuItem key={option} value={option.toLowerCase()}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Sort By */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="sort-by-label">Sort By</InputLabel>
                <Select
                  labelId="sort-by-label"
                  id="sort-by-select"
                  value={sortBy}
                  onChange={handleSortChange}
                  label="Sort By"
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          {/* Filters Row */}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="price-range-label">Price Range</InputLabel>
                <Select
                  labelId="price-range-label"
                  id="price-range-select"
                  value={priceRange}
                  onChange={handlePriceRangeChange}
                  label="Price Range"
                >
                  {priceRangeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Active Filters */}
            {(specialization || priceRange || availabilityDate) && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {specialization && (
                    <Chip 
                      label={`Specialization: ${specialization}`} 
                      onDelete={() => setSpecialization('')}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {priceRange && (
                    <Chip 
                      label={`Price: ${priceRangeOptions.find(opt => opt.value === priceRange)?.label}`} 
                      onDelete={() => setPriceRange('')}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {availabilityDate && (
                    <Chip 
                      label={`Available on: ${format(availabilityDate, 'MMM d, yyyy')}`} 
                      onDelete={clearDate}
                      color="primary"
                      variant="outlined"
                      icon={<CalendarMonthIcon />}
                    />
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading Indicator */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
            <CircularProgress />
          </Box>
        ) : coaches.length === 0 ? (
          // Empty State
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <SportsCricketIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No coaches found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search criteria or check back later.
            </Typography>
          </Paper>
        ) : (
          // Coaches Grid
          <>
            <Grid container spacing={3}>
              {coaches.map((coach) => (
                <Grid item xs={12} sm={6} md={4} key={coach._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar 
                          src={coach.user?.profileImage || ''} 
                          alt={coach.user?.name}
                          sx={{ width: 64, height: 64, mr: 2 }}
                        >
                          {coach.user?.name?.charAt(0) || 'C'}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="div">
                            {coach.user?.name || 'Coach'}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {coach.experience} {coach.experience === 1 ? 'year' : 'years'} of experience
                      </Typography>

                      <Typography variant="h6" color="primary" gutterBottom>
                        ${coach.hourlyRate}/hour
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {coach.bio?.substring(0, 100)}
                        {coach.bio?.length > 100 ? '...' : ''}
                      </Typography>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {coach.specializations?.map((specialization, index) => (
                          <Chip 
                            key={index} 
                            label={specialization} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        ))}
                      </Box>
                    </CardContent>

                    <CardActions>
                      <Button 
                        size="small" 
                        color="primary" 
                        component={Link} 
                        to={`/coaches/${coach._id}`}
                        fullWidth
                      >
                        View Profile
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination 
                  count={totalPages} 
                  page={page} 
                  onChange={handlePageChange} 
                  color="primary" 
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </LocalizationProvider>
  );
};

export default CoachesList;
