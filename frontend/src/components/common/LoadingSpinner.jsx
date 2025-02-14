import { CircularProgress, Box } from '../shared/MuiComponents.jsx';

const LoadingSpinner = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="200px"
    >
      <CircularProgress />
    </Box>
  );
};

export default LoadingSpinner; 