import { Link } from 'react-router-dom';

const BookingCard = ({ booking, onCancel, isCoach = false }) => {
  // Format date and time
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if booking can be cancelled
  const canCancel = () => {
    return (
      booking.status === 'confirmed' &&
      new Date(booking.date) > new Date() &&
      typeof onCancel === 'function'
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg">
              {isCoach ? booking.user.name : booking.coach.name}
            </h3>
            <p className="text-gray-500 text-sm">
              {isCoach ? 'Student' : 'Coach'}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <div>
              <p className="text-gray-700">{formatDate(booking.date)}</p>
              <p className="text-gray-500 text-sm">{formatTime(booking.time)}</p>
            </div>
          </div>

          {booking.location && (
            <div className="flex items-start">
              <svg className="w-5 h-5 text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <p className="text-gray-700">{booking.location}</p>
            </div>
          )}

          {booking.amount && (
            <div className="flex items-start">
              <svg className="w-5 h-5 text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-gray-700">₹{booking.amount}</p>
            </div>
          )}

          {booking.notes && (
            <div className="flex items-start">
              <svg className="w-5 h-5 text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p className="text-gray-700">{booking.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-between">
          <Link 
            to={`/bookings/${booking.id}`} 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Details
          </Link>
          
          {canCancel() && (
            <button 
              onClick={() => onCancel(booking.id)} 
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCard; 