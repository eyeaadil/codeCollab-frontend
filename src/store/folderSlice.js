import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk to fetch folders
export const fetchFolders = createAsyncThunk('folder/fetchFolders', async () => {
  const response = await axios.get('http://localhost:5000/api/folders/folders', {
    withCredentials: true, // For cookies
  });
  return response.data; // Return the data directly
});

// Async thunk to create a folder
export const createFolder = createAsyncThunk('folder/createFolder', async (folderData) => {
  const response = await axios.post('http://localhost:5000/api/folders', folderData, {
    withCredentials: true, // For sending cookies
  });
  return response.data; // Return the newly created folder
});

const folderSlice = createSlice({
  name: 'folder',
  initialState: {
    folders: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.loading = false;
        state.folders = action.payload; // Update folders data on success
      })
      .addCase(fetchFolders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createFolder.fulfilled, (state, action) => {
        state.folders.push(action.payload); // Add new folder to the state
      });
  },
});

export default folderSlice.reducer;
