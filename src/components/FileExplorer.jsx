import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFiles, createFile } from '../store/fileSlice';
import { fetchFolders, createFolder } from '../store/folderSlice';
import { ChevronRight, ChevronDown, File, Folder, X, Plus } from 'lucide-react';
import Editor from '@monaco-editor/react';

const FileExplorer = () => {
  const dispatch = useDispatch();
  const { files = [], loading: filesLoading, status: fileStatus } = useSelector((state) => state.file);
  const { folders = [], loading: foldersLoading, status: folderStatus } = useSelector((state) => state.folder);

  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [openedFiles, setOpenedFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFile, setCreatingFile] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  // Fetch files and folders on mount
  useEffect(() => {
    dispatch(fetchFiles());
    dispatch(fetchFolders());
  }, [dispatch]);

  // Log selected folder ID
  useEffect(() => {
    console.log("Selected Folder ID:", selectedFolderId);
  }, [selectedFolderId]);

  // Handle file click
  const handleFileClick = (file) => {
    setOpenedFiles((prevFiles) => {
      if (!prevFiles.some(f => f._id === file._id)) {
        return [...prevFiles, file];
      }
      return prevFiles;
    });
    setActiveFile(file);
  };

  // Handle file close
  const handleCloseFile = (fileId) => {
    setOpenedFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter(f => f._id !== fileId);
      if (activeFile?._id === fileId) {
        setActiveFile(updatedFiles.length > 0 ? updatedFiles[updatedFiles.length - 1] : null);
      }
      return updatedFiles;
    });
  };

  // Toggle folder expansion
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      newSet.has(folderId) ? newSet.delete(folderId) : newSet.add(folderId);
      return newSet;
    });
  };

  // Handle folder selection
  const handleFolderClick = (folderId) => {
    setSelectedFolderId(folderId);
    setExpandedFolders(prev => new Set(prev).add(folderId));
  };

  // Get files for a specific folder
  const getFilesForFolder = (folderId) => files.files?.filter(file => file.folder === folderId) || [];

  // Get unassigned files
  const getUnassignedFiles = () => files.files?.filter(file => !file.folder) || [];

  // Handle new file creation
  const handleNewFile = () => {
    if (!selectedFolderId) {
      alert('Please select a folder first.');
      return;
    }
    setCreatingFile(true);
    setNewFileName('');
    setCreatingFolder(false);
  };

  // Handle new folder creation
  const handleNewFolder = () => {
    if (!selectedFolderId) {
      alert('Please select a folder first.');
      return;
    }
    setCreatingFolder(true);
    setNewFolderName('');
    setCreatingFile(false);
  };

  // Create file on Enter key press
  const handleCreateFile = async (e) => {
    if (newFileName && e.key === 'Enter') {
      try {
        await dispatch(createFile({ name: newFileName, folder: selectedFolderId })).unwrap();
        setCreatingFile(false);
        setNewFileName('');
      } catch (error) {
        console.error('Failed to create file:', error);
      }
    }
  };

  // Create folder on Enter key press
  const handleCreateFolder = async (e) => {
    if (newFolderName && e.key === 'Enter') {
      try {
        await dispatch(createFolder({ name: newFolderName, parentFolder: selectedFolderId })).unwrap();
        setCreatingFolder(false);
        setNewFolderName('');
      } catch (error) {
        console.error('Failed to create folder:', error);
      }
    }
  };

  // Sidebar resizing logic
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setStartWidth(sidebarWidth);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newWidth = startWidth + (e.clientX - startX);
    setSidebarWidth(Math.max(200, Math.min(newWidth, 500)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="h-screen flex bg-[#1e1e1e] text-white" style={{ height: '110%', width: '100%' }}>
      {/* Sidebar */}
      <div
        className="relative flex-none h-full bg-[#1f1f1f] border-r border-[#2d2d2d]"
        style={{ width: `${sidebarWidth}px` }}
      >
        <div
          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500"
          onMouseDown={handleMouseDown}
        />
        {/* Explorer Header */}
        <div className="h-12 px-4 flex items-center text-sm font-medium text-gray-400 border-b border-[#2d2d2d] bg-[#1f1f1f]">
          EXPLORER
          <button
            className="ml-4 p-2 bg-blue-500 rounded text-white"
            onClick={handleNewFile}
          >
            <Plus size={16} />
          </button>
          <button
            className="ml-2 p-2 bg-green-500 rounded text-white"
            onClick={handleNewFolder}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* File Tree */}
        <div className="h-[calc(100%-48px)] overflow-y-auto sidebar-content p-2">
          {folders.map(folder => (
            <div key={folder._id} className="mb-1">
              <div 
                className={`flex items-center rounded px-2 py-1 cursor-pointer transition-colors duration-150 
                  ${selectedFolderId === folder._id 
                    ? 'bg-blue-600/30 hover:bg-blue-600/40' 
                    : 'hover:bg-[#2a2a2a]'
                  }`}
                onClick={() => handleFolderClick(folder._id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(folder._id);
                  }}
                  className="mr-1"
                >
                  {expandedFolders.has(folder._id) ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </button>
                <div className="flex items-center flex-grow">
                  <Folder size={16} className="mr-2 text-blue-400" />
                  <span className="text-gray-300 truncate">{folder.name}</span>
                </div>
              </div>
              {expandedFolders.has(folder._id) && (
                <div className="ml-4">
                  {getFilesForFolder(folder._id).map(file => (
                    <div
                      key={file._id}
                      className={`flex items-center rounded px-2 py-1 cursor-pointer hover:bg-[#2a2a2a] transition-colors duration-150 ${activeFile?._id === file._id ? 'bg-[#37373d]' : ''}`}
                      onClick={() => handleFileClick(file)}
                    >
                      <File size={16} className="mr-2 text-gray-400" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
                  {creatingFolder && selectedFolderId === folder._id && (
                    <div className="mt-1 ml-2 relative">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={handleCreateFolder}
                        placeholder="New folder name"
                        className="border border-blue-500 p-1 pr-8 rounded bg-[#3a3a4a] text-white w-full 
                          placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      {folderStatus === 'loading' && (
                        <div className="absolute right-2 top-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                  )}
                  {creatingFile && selectedFolderId === folder._id && (
                    <div className="mt-1 ml-2 relative">
                      <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyDown={handleCreateFile}
                        placeholder="New file name"
                        className="border border-green-500 p-1 pr-8 rounded bg-[#3a3a4a] text-white w-full 
                          placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                        autoFocus
                      />
                      {fileStatus === 'loading' && (
                        <div className="absolute right-2 top-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Unassigned Files */}
          {getUnassignedFiles().map(file => (
            <div
              key={file._id}
              className={`flex items-center rounded px-2 py-1 cursor-pointer hover:bg-[#2a2a2a] transition-colors duration-150 ${activeFile?._id === file._id ? 'bg-[#37373d]' : ''}`}
              onClick={() => handleFileClick(file)}
            >
              <File size={16} className="mr-2 text-gray-400" />
              <span className="truncate">{file.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Open Files Header */}
        {openedFiles.length > 0 && (
          <div className="h-10 flex items-center border-b border-[#2d2d2d] bg-[#1f1f1f] overflow-x-auto">
            {openedFiles.map(file => (
              <div
                key={file._id}
                className={`flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-[#2a2a2a] transition-colors ${
                  activeFile?._id === file._id ? 'bg-[#37373d]' : ''
                }`}
                onClick={() => setActiveFile(file)}
              >
                <span className="mr-2 text-gray-300 truncate">{file.name}</span>
                <X
                  size={16}
                  className="text-gray-400 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseFile(file._id);
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Code Editor */}
        <div className="flex-1 relative">
          {activeFile ? (
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={activeFile.content || 'No content available'}
              options={{ minimap: { enabled: false }, fontSize: 16, padding: { top: 20 } }}
              className="rounded-lg overflow-hidden border border-editor-accent/20"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-500">
              <p>Select a file to start coding</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;