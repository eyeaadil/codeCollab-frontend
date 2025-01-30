import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFiles } from '../store/fileSlice';
import { fetchFolders } from '../store/folderSlice';
import { ChevronRight, ChevronDown, File, Folder, X, Plus } from 'lucide-react';
import Editor from '@monaco-editor/react';

const FileExplorer = () => {
  const dispatch = useDispatch();
  const { files = [], loading: filesLoading } = useSelector((state) => state.file);
  const { folders = [], loading: foldersLoading } = useSelector((state) => state.folder);
  
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

  useEffect(() => {
    dispatch(fetchFiles());
    dispatch(fetchFolders());
  }, [dispatch]);

  const handleFileClick = (file) => {
    setOpenedFiles((prevFiles) => {
      if (!prevFiles.some(f => f._id === file._id)) {
        return [...prevFiles, file];
      }
      return prevFiles;
    });
    setActiveFile(file);
  };

  const handleCloseFile = (fileId) => {
    setOpenedFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter(f => f._id !== fileId);
      if (activeFile?._id === fileId) {
        setActiveFile(updatedFiles.length > 0 ? updatedFiles[updatedFiles.length - 1] : null);
      }
      return updatedFiles;
    });
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      newSet.has(folderId) ? newSet.delete(folderId) : newSet.add(folderId);
      return newSet;
    });
  };

  const getFilesForFolder = (folderId) => files.files?.filter(file => file.folder === folderId) || [];
  const getUnassignedFiles = () => files.files?.filter(file => !file.folder) || [];

  const handleNewFile = () => {
    setCreatingFile(true);
  };

  const handleNewFolder = () => {
    setCreatingFolder(true);
  };

  const handleCreateFile = (e) => {
    if (newFileName && e.key === 'Enter') {
      // Dispatch an action to create the new file
      // dispatch(createFile({ name: newFileName }));
      setCreatingFile(false);
      setNewFileName('');
    }
  };

  const handleCreateFolder = (e) => {
    if (newFolderName && e.key === 'Enter') {
      // Dispatch an action to create the new folder
      // dispatch(createFolder({ name: newFolderName }));
      setCreatingFolder(false);
      setNewFolderName('');
    }
  };

  return (
    <div className="h-screen flex bg-[#1e1e1e] text-white" style={{border:'solid black', height: '110%', width: '100%'}}>
      {/* Sidebar */}
      <div
        className="relative flex-none h-full bg-[#1f1f1f] border-r border-[#2d2d2d]"
        style={{ width: `${sidebarWidth}px`, border: '1px solid white' }}
      >
        {/* Explorer Header */}
        <div className="h-12 px-4 flex items-center text-sm font-medium text-gray-400 border-b border-[#2d2d2d] bg-[#1f1f1f]" style={{border: '1px solid yellow'}}>
          EXPLORER
          <button
            className="ml-4 p-2 bg-blue-500 rounded text-white"
            onClick={handleNewFile}
          >
            <Plus size={16} className="mr-2" /> 
          </button>
          <button
            className="ml-2 p-2 bg-green-500 rounded text-white"
            onClick={handleNewFolder}
          >
            <Plus size={16} className="mr-2" /> 
          </button>
        </div>

        {/* File Tree */}
        <div className="h-[calc(100%-48px)] overflow-y-auto sidebar-content p-2">
          {folders.map(folder => (
            <div key={folder._id} className="mb-1">
              <div
                className="flex items-center rounded px-2 py-1 cursor-pointer hover:bg-[#2a2a2a] transition-colors duration-150"
                onClick={() => toggleFolder(folder._id)}
              >
                {expandedFolders.has(folder._id) ? <ChevronDown size={16} className="mr-1 text-gray-400" /> : <ChevronRight size={16} className="mr-1 text-gray-400" />}
                <Folder size={16} className="mr-2 text-blue-400" />
                <span className="text-gray-300 truncate">{folder.name}</span>
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
                </div>
              )}
            </div>
          ))}

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

          {/* Create New File/Folder Input */}
          {(creatingFile || creatingFolder) && (
            <div className="mt-4 pl-4">
              <input
                type="text"
                value={creatingFile ? newFileName : newFolderName}
                onChange={(e) => creatingFile ? setNewFileName(e.target.value) : setNewFolderName(e.target.value)}
                onKeyDown={creatingFile ? handleCreateFile : handleCreateFolder}
                placeholder={creatingFile ? "Enter file name" : "Enter folder name"}
                className="border p-2 rounded mb-4 bg-[#2a2a2a] text-white w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col h-full relative" style={{backgroundColor: "green"}} >
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
        <div className="flex-1  relative" style={{backgroundColor:"yellow "}} >
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
