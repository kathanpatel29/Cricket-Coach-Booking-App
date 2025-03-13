import { useState } from 'react';
import api from '../services/api';

const TimeSlotItem = ({ timeSlot, onUpdate, onDelete, isSelectable = false, onSelect, isSelected = false }) => {
  const [isAvailable, setIsAvailable] = useState(timeSlot.isAvailable);
  const [isLoading, setIsLoading] = useState(false);

  // Format time
  const formatTime = (timeString) => {
    return timeString;
  };

  // Handle toggle availability
  const handleToggleAvailability = async (e) => {
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await api.put(`/timeslots/${timeSlot.id}`, {
        isAvailable: !isAvailable,
      });
      
      setIsAvailable(!isAvailable);
      
      if (onUpdate) {
        onUpdate(response.data);
      }
    } catch (error) {
      console.error('Error updating time slot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (e) => {
    e.stopPropagation();
    
    if (isLoading) return;
    
    if (window.confirm('Are you sure you want to delete this time slot?')) {
      setIsLoading(true);
      
      try {
        await api.delete(`/timeslots/${timeSlot.id}`);
        
        if (onDelete) {
          onDelete(timeSlot.id);
        }
      } catch (error) {
        console.error('Error deleting time slot:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle select
  const handleSelect = () => {
    if (isSelectable && isAvailable && onSelect) {
      onSelect(timeSlot);
    }
  };

  return (
    <div 
      className={`border rounded-md p-3 mb-2 ${
        isSelectable 
          ? isAvailable 
            ? isSelected 
              ? 'border-blue-500 bg-blue-50 cursor-pointer' 
              : 'border-gray-200 hover:border-blue-300 cursor-pointer' 
            : 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
          : isAvailable 
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
      }`}
      onClick={handleSelect}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="font-medium">
            {formatTime(timeSlot.startTime)} - {formatTime(timeSlot.endTime)}
          </p>
          {timeSlot.date && (
            <p className="text-sm text-gray-500">
              {new Date(timeSlot.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>
        
        {!isSelectable && (
          <div className="flex space-x-2">
            <button
              onClick={handleToggleAvailability}
              disabled={isLoading}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                isAvailable 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              } transition-colors`}
            >
              {isLoading ? '...' : isAvailable ? 'Mark Unavailable' : 'Mark Available'}
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              {isLoading ? '...' : 'Delete'}
            </button>
          </div>
        )}
        
        {isSelectable && (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            isSelected 
              ? 'bg-blue-500 text-white' 
              : isAvailable 
                ? 'border-2 border-gray-300' 
                : 'bg-gray-200'
          }`}>
            {isSelected && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
            )}
          </div>
        )}
      </div>
      
      {timeSlot.bookedBy && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Booked by: <span className="font-medium">{timeSlot.bookedBy.name}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeSlotItem; 