import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk to fetch files
export const fetchFiles = createAsyncThunk('file/fetchFiles', async () => {
  const response = await axios.get('http://localhost:5000/api/files', {
    withCredentials: true, // For sending cookies
  });
  return response.data; // Return the data directly
});

// Async thunk to create a file
export const createFile = createAsyncThunk('file/createFile', async (fileData) => {
  const response = await axios.post('http://localhost:5000/api/files', fileData, {
    withCredentials: true, // For sending cookies
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data; // Return the newly created file
});

const fileSlice = createSlice({
  name: 'file',
  initialState: {
    files: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload; // Update files data on success
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createFile.fulfilled, (state, action) => {
        state.files.push(action.payload); // Add new file to the state
      });
  },
});

export default fileSlice.reducer;
