import { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import { Users, FolderPlus, FileText, X } from "lucide-react";

export const CodeEditor = () => {
  const [code, setCode] = useState("// Start coding here...");
  const [activeUsers, setActiveUsers] = useState(1);
  const [fileStructure, setFileStructure] = useState({
    "index.js": { name: "index.js", type: "file", content: "// JS Code" },
    "App.js": { name: "App.js", type: "file", content: "// App Code" },
    src: {
      name: "src",
      type: "folder",
      children: [
        { name: "App.css", type: "file", content: "/* CSS Code */" },
        { name: "utils.js", type: "file", content: "// Utility Functions" },
      ],
    },
    public: {
      name: "public",
      type: "folder",
      children: [
        { name: "index.html", type: "file", content: "<html></html>" },
      ],
    },
  });
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [newFileName, setNewFileName] = useState("");
  const [fileExplorerWidth, setFileExplorerWidth] = useState(300);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [creatingFile, setCreatingFile] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set()); // Track expanded folders
  const isDragging = useRef(false);
  const initialWidth = useRef(0);
  const initialX = useRef(0);

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
    const newFile = {
      name: fileName,
      type: "file",
      content: "// New File Content",
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
        const found = findFileRecursively(file.children, fileName);
        if (found) return found;
      }
    }
    return null;
  };

  const handleCloseFile = (fileName) => {
    setOpenFiles((files) => {
      const remainingFiles = files.filter((file) => file.name !== fileName);

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
      setCode(nextFile ? nextFile.content : "// Start coding here...");

      return remainingFiles;
    });
  };

  const renderFileExplorer = (structure, parentPath = "") => {
    return Object.keys(structure).map((key) => {
      const file = structure[key];
      const currentPath = parentPath ? `${parentPath}/${file.name}` : file.name;
      const isExpanded = expandedFolders.has(currentPath);

      return (
        <div key={key} className="relative">
          <div
            className={`p-2 text-white cursor-pointer hover:bg-gray-700 rounded ${activeFile === file.name ? "bg-gray-600" : ""
              } ${selectedFolder === currentPath ? "bg-blue-600" : ""}`}
            onClick={(e) => {
              if (file.type === "folder") {
                toggleFolder(currentPath, e);
              }
              handleFileSelect(file.name, file.type, parentPath, e);
            }}
          >
            {file.type === "folder" ? (isExpanded ? "📂 " : "📁 ") : "📄 "} {file.name}
          </div>
          {file.type === "folder" && (
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
              {file.children && renderFileExplorer(file.children, currentPath)}
            </div>
          )}
        </div>
      );
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
      if (newWidth >= 200 && newWidth <= 600) {
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
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full w-full flex border border-editor-accent/20 rounded-lg overflow-hidden"
    >
      {/* Sidebar - File Explorer */}
      <div
        className="bg-gray-800 p-4 rounded-lg"
        style={{ width: `${fileExplorerWidth}px` }}
      >
        <h2 className="text-white text-lg">Files</h2>
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center gap-2" style={{ width: '100%' }}>
            {/* Search Box */}
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="File/Folder Name"
              className="flex-grow min-w-0 px-2 py-1 rounded bg-gray-700 text-white"
            />

            {/* Create File Button */}
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
                    content: "// New File Content",
                  };
                  setFileStructure({ ...fileStructure, [newFileName]: newFile });
                  setNewFileName("");
                }
              }}
              title="Create File"
            >
              <FileText className="w-5 h-5" />
            </button>

            {/* Create Folder Button */}
            <button
              className="text-blue-400 min-w-0 flex-shrink-0"
              onClick={() => setCreatingFolder(true)}
              title="Create Folder"
            >
              <FolderPlus className="w-5 h-5" />
            </button>
          </div>

          {/* Folder Name Input Box for Folder Creation */}
          {creatingFolder && (
            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFolderCreate()}
                placeholder="Folder Name"
                className="px-2 py-1 rounded bg-gray-700 text-white w-full"
              />
            </div>
          )}

          <div className="mt-4 space-y-2">{renderFileExplorer(fileStructure)}</div>
        </div>
      </div>

      {/* Resizer */}
      <div
        className="cursor-ew-resize bg-gray-600"
        onMouseDown={startDragging}
        style={{ width: "10px", backgroundColor: "#333" }}
      ></div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Open Files Tabs */}
        <div className="flex items-center bg-gray-900 text-white px-4 py-2 space-x-2">
          {openFiles.map((file) => (
            <div
              key={file.name}
              className={`px-3 py-1 rounded flex items-center gap-2 ${activeFile === file.name ? "bg-gray-700" : ""
                }`}
              onClick={() => {
                setActiveFile(file.name);
                setCode(file.content);
              }}
            >
              {file.name}
              <button
                className="text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseFile(file.name);
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Code Editor */}
        <div className="flex-1 relative">
          {activeFile ? (
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 16,
                padding: { top: 20 },
              }}
              className="rounded-lg overflow-hidden border border-editor-accent/20"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-500">
              <p>Select a file to start coding</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};