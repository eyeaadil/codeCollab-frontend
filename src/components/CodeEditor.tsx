import { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { FolderPlus, FileText, X, ChevronRight, ChevronDown, Menu } from "lucide-react";

export const CodeEditor = () => {
  // Initialize state from localStorage or default values
  const [fileStructure, setFileStructure] = useState(() => {
    const savedStructure = localStorage.getItem("fileStructure");
    return savedStructure ? JSON.parse(savedStructure) : {
      "index.js": { name: "index.js", type: "file", content: "// Start coding here..." },
      "README.md": { name: "README.md", type: "file", content: "# My Project\n\nWelcome to my coding project!" },
      src: {
        name: "src",
        type: "folder",
        children: [
          { name: "App.js", type: "file", content: "// React component" },
          { name: "styles.css", type: "file", content: "/* CSS styles */" },
        ],
      },
    };
  });

  const [openFiles, setOpenFiles] = useState(() => {
    const savedOpenFiles = localStorage.getItem("openFiles");
    return savedOpenFiles ? JSON.parse(savedOpenFiles) : [];
  });

  const [activeFile, setActiveFile] = useState(() => {
    return localStorage.getItem("activeFile") || null;
  });

  const [code, setCode] = useState(() => {
    const activeFileName = localStorage.getItem("activeFile");
    if (!activeFileName) return "// Start coding here...";
    
    const savedOpenFiles = localStorage.getItem("openFiles");
    if (!savedOpenFiles) return "// Start coding here...";
    
    const files = JSON.parse(savedOpenFiles);
    const activeFileContent = files.find(file => file.name === activeFileName)?.content;
    return activeFileContent || "// Start coding here...";
  });

  const [expandedFolders, setExpandedFolders] = useState(() => {
    const savedExpandedFolders = localStorage.getItem("expandedFolders");
    return savedExpandedFolders ? new Set(JSON.parse(savedExpandedFolders)) : new Set();
  });

  const [fileExplorerWidth, setFileExplorerWidth] = useState(() => {
    return parseInt(localStorage.getItem("fileExplorerWidth")) || 300;
  });

  // Add mobile responsiveness state
  const [showSidebar, setShowSidebar] = useState(() => {
    // On mobile devices, default to hidden sidebar
    return window.innerWidth > 768;
  });

  // UI state
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [creatingFile, setCreatingFile] = useState(false);
  
  // Dragging refs
  const isDragging = useRef(false);
  const initialWidth = useRef(0);
  const initialX = useRef(0);
  
  // Refs for scrolling
  const tabsContainerRef = useRef(null);
  const editorContainerRef = useRef(null);

  // Track window size for responsive adjustments
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Detect window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      // Auto-hide sidebar on small screens
      if (window.innerWidth <= 768 && showSidebar) {
        setShowSidebar(false);
      }
      
      // Adjust file explorer width based on screen size
      const maxWidth = window.innerWidth * 0.8;
      if (fileExplorerWidth > maxWidth) {
        setFileExplorerWidth(Math.min(300, maxWidth));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fileExplorerWidth, showSidebar]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("fileStructure", JSON.stringify(fileStructure));
  }, [fileStructure]);

  useEffect(() => {
    localStorage.setItem("openFiles", JSON.stringify(openFiles));
  }, [openFiles]);

  useEffect(() => {
    if (activeFile) {
      localStorage.setItem("activeFile", activeFile);
    }
  }, [activeFile]);

  useEffect(() => {
    localStorage.setItem("expandedFolders", JSON.stringify([...expandedFolders]));
  }, [expandedFolders]);

  useEffect(() => {
    localStorage.setItem("fileExplorerWidth", fileExplorerWidth.toString());
  }, [fileExplorerWidth]);

  const handleEditorChange = (value = "") => {
    setCode(value);
    if (activeFile) {
      setOpenFiles((files) =>
        files.map((file) =>
          file.name === activeFile ? { ...file, content: value } : file
        )
      );
    }
  };

  const toggleFolder = (folderPath, e) => {
    e.stopPropagation(); // Prevent folder selection when toggling
    setExpandedFolders(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(folderPath)) {
        newExpanded.delete(folderPath);
      } else {
        newExpanded.add(folderPath);
      }
      return newExpanded;
    });
  };

  const createFileInFolder = (folderPath, fileName) => {
    if (!fileName.trim()) return;
    
    const newFile = {
      name: fileName,
      type: "file",
      content: `// ${fileName}\n// Created on ${new Date().toLocaleString()}`,
    };

    const updateFileStructure = (structure, path) => {
      if (path.length === 0) {
        if (structure.type === "folder") {
          return {
            ...structure,
            children: [...(structure.children || []), newFile],
          };
        }
        return structure;
      }

      const [currentFolder, ...remainingPath] = path;
      return {
        ...structure,
        children: structure.children.map((item) =>
          item.name === currentFolder
            ? updateFileStructure(item, remainingPath)
            : item
        ),
      };
    };

    if (!folderPath) {
      setFileStructure({
        ...fileStructure,
        [fileName]: newFile,
      });
    } else {
      const path = folderPath.split("/").filter(Boolean);
      const updatedStructure = { ...fileStructure };
      const targetFolder = path[0];

      if (updatedStructure[targetFolder]) {
        updatedStructure[targetFolder] = updateFileStructure(
          updatedStructure[targetFolder],
          path.slice(1)
        );
      }

      setFileStructure(updatedStructure);
    }
    
    // Open the newly created file
    setActiveFile(fileName);
    setOpenFiles(prev => {
      if (!prev.find(f => f.name === fileName)) {
        return [...prev, newFile];
      }
      return prev;
    });
    setCode(newFile.content);
    
    // Hide sidebar on mobile after file creation
    if (windowSize.width <= 768) {
      setShowSidebar(false);
    }
  };

  const handleFileSelect = (fileName, type, folderPath = "", e) => {
    e.stopPropagation(); // Prevent event bubbling

    if (type === "folder") {
      setSelectedFolder(folderPath ? `${folderPath}/${fileName}` : fileName);
    } else {
      const file = findFileRecursively(fileStructure, fileName);
      if (file && file.type === "file") {
        setActiveFile(fileName);
        setCode(file.content || "");
        if (!openFiles.find((f) => f.name === fileName)) {
          setOpenFiles([...openFiles, file]);
        }
        
        // Hide sidebar on mobile after file selection
        if (windowSize.width <= 768) {
          setShowSidebar(false);
        }
      }
    }
  };

  const findFileRecursively = (structure, fileName) => {
    for (const key in structure) {
      const file = structure[key];
      if (file.type === "file" && file.name === fileName) {
        return file;
      }
      if (file.type === "folder" && file.children) {
        const found = file.children.find(child => child.name === fileName);
        if (found) return found;
        
        for (const child of file.children) {
          if (child.type === "folder") {
            const nestedFound = findFileRecursively({ [child.name]: child }, fileName);
            if (nestedFound) return nestedFound;
          }
        }
      }
    }
    return null;
  };

  const handleCloseFile = (fileName, e) => {
    if (e) e.stopPropagation();
    
    setOpenFiles((files) => {
      const remainingFiles = files.filter((file) => file.name !== fileName);

      if (activeFile === fileName) {
        const closedFileIndex = files.findIndex((file) => file.name === fileName);
        let nextFile = null;
        
        if (remainingFiles.length > 0) {
          if (closedFileIndex > 0) {
            nextFile = remainingFiles[closedFileIndex - 1];
          } else {
            nextFile = remainingFiles[0];
          }
        }

        setActiveFile(nextFile ? nextFile.name : null);
        setCode(nextFile ? nextFile.content : "// Select a file to start coding");
      }

      return remainingFiles;
    });
  };

  const renderFileExplorer = (structure, parentPath = "") => {
    return Object.keys(structure).map((key) => {
      const file = structure[key];
      const currentPath = parentPath ? `${parentPath}/${file.name}` : file.name;
      const isExpanded = expandedFolders.has(currentPath);
      const isSelected = selectedFolder === currentPath;

      if (file.type === "folder") {
        return (
          <div key={key} className="relative">
            <div
              className={`p-2 text-white cursor-pointer hover:bg-gray-700 rounded flex items-center ${isSelected ? "bg-blue-600" : ""}`}
              onClick={(e) => handleFileSelect(file.name, file.type, parentPath, e)}
            >
              <span 
                className="mr-1 cursor-pointer" 
                onClick={(e) => toggleFolder(currentPath, e)}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </span>
              📁 {file.name}
            </div>
            <div className={`pl-4 ${isExpanded ? "block" : "hidden"}`}>
              {creatingFile && selectedFolder === currentPath && (
                <div className="flex items-center gap-2 my-2">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        createFileInFolder(selectedFolder, newFileName);
                        setNewFileName("");
                        setCreatingFile(false);
                      }
                    }}
                    placeholder="Enter file name"
                    className="px-2 py-1 rounded bg-gray-700 text-white w-full"
                    autoFocus
                  />
                </div>
              )}
              {file.children && file.children.map((child, index) => {
                const childPath = `${currentPath}`;
                if (child.type === "file") {
                  return (
                    <div 
                      key={index}
                      className={`p-2 text-white cursor-pointer hover:bg-gray-700 rounded ${activeFile === child.name ? "bg-gray-600" : ""}`}
                      onClick={(e) => handleFileSelect(child.name, child.type, "", e)}
                    >
                      📄 {child.name}
                    </div>
                  );
                } else {
                  const nestedStructure = { [child.name]: child };
                  return renderFileExplorer(nestedStructure, childPath);
                }
              })}
            </div>
          </div>
        );
      } else {
        return (
          <div 
            key={key}
            className={`p-2 text-white cursor-pointer hover:bg-gray-700 rounded ${activeFile === file.name ? "bg-gray-600" : ""}`}
            onClick={(e) => handleFileSelect(file.name, file.type, "", e)}
          >
            📄 {file.name}
          </div>
        );
      }
    });
  };

  const startDragging = (e) => {
    isDragging.current = true;
    initialX.current = e.clientX;
    initialWidth.current = fileExplorerWidth;
  };

  const stopDragging = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e) => {
    if (isDragging.current) {
      const diff = e.clientX - initialX.current;
      const newWidth = initialWidth.current + diff;
      // Set min and max width constraints
      const maxAllowedWidth = Math.min(600, windowSize.width * 0.8);
      if (newWidth >= 200 && newWidth <= maxAllowedWidth) {
        setFileExplorerWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, []);

  const handleFolderCreate = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        name: newFolderName,
        type: "folder",
        children: [],
      };
      setFileStructure({
        ...fileStructure,
        [newFolderName]: newFolder,
      });
      setNewFolderName("");
      setCreatingFolder(false);
      // Auto-expand the newly created folder
      setExpandedFolders(prev => new Set([...prev, newFolderName]));
    }
  };

  const getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
  };

  const getLanguageFromExtension = (extension) => {
    const mapping = {
      "js": "javascript",
      "jsx": "javascript",
      "ts": "typescript",
      "tsx": "typescript",
      "py": "python",
      "html": "html",
      "css": "css",
      "json": "json",
      "md": "markdown",
      "java": "java",
      "c": "c",
      "cpp": "cpp",
      "cs": "csharp",
      "go": "go",
      "php": "php",
      "rb": "ruby",
      "rs": "rust",
      "swift": "swift",
      "sh": "shell",
      "sql": "sql",
      "xml": "xml",
      "yaml": "yaml",
      "yml": "yaml",
    };
    return mapping[extension.toLowerCase()] || "plaintext";
  };

  // Calculate appropriate sidebar width based on screen size
  const sidebarWidth = windowSize.width <= 768 
    ? (showSidebar ? '100%' : '0')
    : `${Math.min(fileExplorerWidth, windowSize.width - 50)}px`;

  return (
    <div className="h-full w-full flex flex-col">
      {/* Mobile toolbar */}
      <div className="bg-gray-800 p-2 flex items-center text-white lg:hidden">
        <button
          className="p-2 mr-2 rounded hover:bg-gray-700"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold truncate">
          {activeFile || "Code Editor"}
        </h1>
      </div>
      
      <div className="flex-1 flex overflow-hidden bg-gray-900 relative" style={{ maxWidth: "100vw" }}>
        {/* Mobile overlay - closes sidebar when clicking outside */}
        {showSidebar && windowSize.width <= 768 && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
            onClick={() => setShowSidebar(false)}
          ></div>
        )}
        
        {/* Sidebar - File Explorer */}
        <div
          className={`bg-gray-800 p-4 overflow-y-auto flex-shrink-0 z-20 transition-all duration-300 ease-in-out
                    ${windowSize.width <= 768 ? (showSidebar ? 'fixed left-0 top-0 bottom-0 w-4/5 max-w-xs' : 'hidden') : 'relative'}`}
          style={{ width: windowSize.width > 768 ? sidebarWidth : undefined, minWidth: windowSize.width > 768 ? "200px" : undefined, height: windowSize.width <= 768 ? '100%' : undefined }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-lg">Explorer</h2>
            {windowSize.width <= 768 && (
              <button 
                className="text-white p-1 rounded hover:bg-gray-700"
                onClick={() => setShowSidebar(false)}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2" style={{ width: '100%' }}>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="File/Folder Name"
                className="flex-grow min-w-0 px-2 py-1 rounded bg-gray-700 text-white"
              />

              <button
                className="text-green-400 min-w-0 flex-shrink-0"
                onClick={() => {
                  if (selectedFolder) {
                    setCreatingFile(true);
                    // Auto-expand the selected folder when creating a file
                    setExpandedFolders(prev => new Set([...prev, selectedFolder]));
                  } else {
                    const newFile = {
                      name: newFileName,
                      type: "file",
                      content: `// ${newFileName}\n// Created on ${new Date().toLocaleString()}`,
                    };
                    setFileStructure({ ...fileStructure, [newFileName]: newFile });
                    setNewFileName("");
                    // Open the newly created file
                    setActiveFile(newFileName);
                    setOpenFiles(prev => [...prev, newFile]);
                    setCode(newFile.content);
                    
                    // Hide sidebar on mobile after file creation
                    if (windowSize.width <= 768) {
                      setShowSidebar(false);
                    }
                  }
                }}
                title="Create File"
              >
                <FileText className="w-5 h-5" />
              </button>

              <button
                className="text-blue-400 min-w-0 flex-shrink-0"
                onClick={() => setCreatingFolder(true)}
                title="Create Folder"
              >
                <FolderPlus className="w-5 h-5" />
              </button>
            </div>

            {creatingFolder && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFolderCreate()}
                  placeholder="Folder Name"
                  className="px-2 py-1 rounded bg-gray-700 text-white w-full"
                  autoFocus
                />
              </div>
            )}

            <div className="space-y-2 mt-2 overflow-y-auto">{renderFileExplorer(fileStructure)}</div>
          </div>
        </div>

        {/* Resizer - only visible on larger screens */}
        {windowSize.width > 768 && showSidebar && (
          <div
            className="cursor-ew-resize bg-gray-600 hover:bg-gray-500 transition-colors"
            onMouseDown={startDragging}
            style={{ width: "6px" }}
          ></div>
        )}

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Open Files Tabs with horizontal scrolling */}
          <div 
            ref={tabsContainerRef}
            className="flex items-center bg-gray-800 text-white px-2 py-1 overflow-x-auto whitespace-nowrap"
          >
            {openFiles.map((file) => (
              <div
                key={file.name}
                className={`px-3 py-1 mr-1 rounded-t flex items-center gap-2 cursor-pointer flex-shrink-0 ${
                  activeFile === file.name ? "bg-gray-700" : "bg-gray-900"
                }`}
                onClick={() => {
                  setActiveFile(file.name);
                  setCode(file.content);
                }}
              >
                <span className="truncate max-w-32">{file.name}</span>
                <button
                  className="text-red-400 hover:bg-gray-600 rounded-full p-1"
                  onClick={(e) => handleCloseFile(file.name, e)}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Code Editor with overflow handling */}
          <div 
            ref={editorContainerRef}
            className="flex-1 overflow-auto"
          >
            {activeFile ? (
              <Editor
                height="100%"
                defaultLanguage={getLanguageFromExtension(getFileExtension(activeFile))}
                language={getLanguageFromExtension(getFileExtension(activeFile))}
                theme="vs-dark"
                value={code}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: windowSize.width > 768 }, // Disable minimap on small screens
                  fontSize: 14,
                  padding: { top: 10 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: "on",
                  wordWrap: windowSize.width < 768 ? "on" : "off", // Enable word wrap on small screens
                  tabSize: 2,
                  scrollbar: {
                    horizontal: 'auto',
                    useShadows: true,
                    verticalHasArrows: true,
                    horizontalHasArrows: true,
                  }
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-500 bg-gray-900 p-4">
                <div className="text-center">
                  <p className="text-xl mb-4">Welcome to the Code Editor</p>
                  <p>Select a file to start coding or create a new one</p>
                  {windowSize.width <= 768 && !showSidebar && (
                    <button 
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                      onClick={() => setShowSidebar(true)}
                    >
                      Open File Explorer
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;