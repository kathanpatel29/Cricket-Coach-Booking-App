import { format, parseISO, isValid, addMinutes, isBefore, isAfter, differenceInHours } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return isValid(parsedDate) ? format(parsedDate, 'PPP') : '';
};

export const formatTime = (date) => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return isValid(parsedDate) ? format(parsedDate, 'p') : '';
};

export const formatDateTime = (dateString) => {
  return format(parseISO(dateString), 'MMM dd, yyyy hh:mm a');
};

export const generateTimeSlots = (startTime, endTime, duration = 60) => {
  const slots = [];
  let currentTime = startTime;

  while (isBefore(currentTime, endTime)) {
    slots.push({
      start: currentTime,
      end: addMinutes(currentTime, duration)
    });
    currentTime = addMinutes(currentTime, duration);
  }

  return slots;
};

export const isTimeSlotAvailable = (slot, bookings) => {
  return !bookings.some(booking => 
    (isAfter(slot.start, booking.start) && isBefore(slot.start, booking.end)) ||
    (isAfter(slot.end, booking.start) && isBefore(slot.end, booking.end))
  );
};

export const BOOKING_CUTOFF_HOURS = 12; // Configurable

export const isBookingAllowed = (slotTime) => {
  const now = new Date();
  const slotDateTime = parseISO(slotTime);
  const hoursDifference = differenceInHours(slotDateTime, now);
  return hoursDifference >= BOOKING_CUTOFF_HOURS;
};

export const getAvailabilityStatus = (coach) => {
  if (!coach.hasAvailability) {
    return {
      status: 'unavailable',
      label: 'No Availability',
      color: 'default'
    };
  }

  if (!isBookingAllowed(coach.nextAvailableSlot)) {
    return {
      status: 'closed',
      label: 'Booking Closed',
      color: 'error'
    };
  }

  return {
    status: 'available',
    label: 'Available for Booking',
    color: 'success'
  };
}; 