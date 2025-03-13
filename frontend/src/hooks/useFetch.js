import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { immediate = true } = options;

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(url, { params });
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url]);

  const postData = useCallback(async (body) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(url, body);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while posting data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url]);

  const putData = useCallback(async (body) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.put(url, body);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while updating data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url]);

  const deleteData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.delete(url);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while deleting data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate]);

  return { data, loading, error, fetchData, postData, putData, deleteData };
}; 