import axios from 'axios';
import { setFiles, setFolders, setLoading, setError } from './fileSlice.ts'; // Updated import to .ts

// Fetch files from the backend
export const fetchFiles = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const response = await axios.get('/api/files'); // Adjust the endpoint as necessary
    dispatch(setFiles(response.data));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

// Fetch folders from the backend
export const fetchFolders = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const response = await axios.get('/api/folders'); // Adjust the endpoint as necessary
    dispatch(setFolders(response.data));
  } catch (error) {
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};
