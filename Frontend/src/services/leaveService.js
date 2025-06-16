import axios from 'axios';

export const getFloatingLeaves = async () => {
  const response = await axios.get('/api/calendar/floating-leaves');
  return response.data;
};