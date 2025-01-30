import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFolders } from '../store/folderSlice';

const FolderList = () => {
  const dispatch = useDispatch();
  const { folders, loading, error } = useSelector((state) => state.folder);

  console.log("mohabbat", folders);
  useEffect(() => {
    dispatch(fetchFolders());
  }, [dispatch]);

  if (loading) return <p>Loading folders...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Your Folders</h2>
      {folders.length === 0 ? (
        <p>No folders available</p>
      ) : (
        <ul>
          {folders.map((folder) => (
            <li key={folder._id}>{folder.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FolderList;
