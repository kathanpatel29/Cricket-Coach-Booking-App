const coachService = {
  getEmergencyOff: async () => {
    try {
      const response = await api.get('/api/coach/emergency-off');
      return response;
    } catch (error) {
      throw error;
    }
  },

  setEmergencyOff: async (data) => {
    try {
      const response = await api.post('/api/coach/emergency-off', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  removeEmergencyOff: async (date) => {
    try {
      const response = await api.delete(`/api/coach/emergency-off/${date}`);
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default coachService; 