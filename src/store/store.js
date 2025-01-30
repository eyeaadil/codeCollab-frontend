import { configureStore } from '@reduxjs/toolkit';
import folderReducer from './folderSlice';
import fileReducer from './fileSlice';
const store = configureStore({
  reducer: {
    folder: folderReducer,
    file: fileReducer,
  },
});

export default store;
