import { parseISO, differenceInHours, addDays, isBefore, isAfter } from 'date-fns';

export const isSlotBookable = (slot, cutoffHours) => {
  const now = new Date();
  const slotDateTime = parseISO(slot.startTime);
  const hoursDifference = differenceInHours(slotDateTime, now);
  return hoursDifference >= cutoffHours && !slot.isBooked;
};

export const getAvailableSlots = (slots, settings) => {
  const now = new Date();
  const maxDate = addDays(now, settings.availabilityDays);
  
  return slots.filter(slot => {
    const slotDate = parseISO(slot.startTime);
    return (
      !slot.isBooked &&
      isAfter(slotDate, now) &&
      isBefore(slotDate, maxDate) &&
      isSlotBookable(slot, settings.bookingCutoffHours)
    );
  });
}; 