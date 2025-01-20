import React, { useState, useEffect } from "react";

const FileExplorer = () => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const file_id = "file_id";  // Assuming you have a session ID

  // Fetch files and folders from the backend
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch files
      const fileResponse = await fetch(`/api/files/${folder_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add token or any other header if needed
        },
      });
      if (!fileResponse.ok) throw new Error("Failed to fetch files");
      const filesData = await fileResponse.json();

      // Fetch folders
      const folderResponse = await fetch(`/api/folders/${file_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add token or any other header if needed
        },
      });
      if (!folderResponse.ok) throw new Error("Failed to fetch folders");
      const foldersData = await folderResponse.json();

      // Set the fetched data to state
      setFiles(filesData);
      setFolders(foldersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create a new file
  const createFile = async () => {
    try {
      const newFile = { name: newFileName };
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newFile),
      });
      if (!response.ok) throw new Error("Failed to create file");
      const createdFile = await response.json();
      setFiles((prevFiles) => [...prevFiles, createdFile]);
      setNewFileName("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Create a new folder
  const createFolder = async () => {
    try {
      const newFolder = { name: newFolderName };
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newFolder),
      });
      if (!response.ok) throw new Error("Failed to create folder");
      const createdFolder = await response.json();
      setFolders((prevFolders) => [...prevFolders, createdFolder]);
      setNewFolderName("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Update file
  const updateFile = async (fileId, newContent) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newContent }),
      });
      if (!response.ok) throw new Error("Failed to update file");
      const updatedFile = await response.json();
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId ? { ...file, content: updatedFile.content } : file
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete file
  const deleteFile = async (fileId) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to delete file");
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete folder
  const deleteFolder = async (folderId) => {
    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to delete folder");
      setFolders((prevFolders) => prevFolders.filter((folder) => folder.id !== folderId));
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch data on initial render
  useEffect(() => {
    fetchData();
  }, [session_id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>File Explorer</h1>
      <div>
        {/* Create New File */}
        <input
          type="text"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          placeholder="New File Name"
        />
        <button onClick={createFile}>Create File</button>
      </div>

      <div>
        {/* Create New Folder */}
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="New Folder Name"
        />
        <button onClick={createFolder}>Create Folder</button>
      </div>

      <h2>Folders</h2>
      <ul>
        {folders.map((folder) => (
          <li key={folder.id}>
            {folder.name}
            <button onClick={() => deleteFolder(folder.id)}>Delete Folder</button>
          </li>
        ))}
      </ul>

      <h2>Files</h2>
      <ul>
        {files.map((file) => (
          <li key={file.id}>
            {file.name}
            <button onClick={() => deleteFile(file.id)}>Delete File</button>
            <button onClick={() => updateFile(file.id, "New content")}>Update File</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileExplorer;
