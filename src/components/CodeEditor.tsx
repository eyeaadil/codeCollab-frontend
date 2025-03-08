import { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { FolderPlus, FileText, X, ChevronRight, ChevronDown, Menu } from "lucide-react";

export const CodeEditor = () => {
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

  const wsRef = useRef<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [code, setCode] = useState("");
  
  // Message queue for storing messages when WebSocket is not ready
  const messageQueueRef = useRef<Array<any>>([]);
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  
  // Debounce mechanism for editor changes
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>("");
  const editorInstanceRef = useRef(null);
  const clientIdRef = useRef(`client-${Math.random().toString(36).substring(2, 9)}`);
  
  // Track if changes are coming from the network to avoid echo
  const receivingExternalChangesRef = useRef(false);
  
  // Function to establish WebSocket connection with better error handling
  const connectWebSocket = () => {
    // Prevent multiple connection attempts
    if (isConnectingRef.current) {
      return;
    }
    
    isConnectingRef.current = true;
    console.log('Establishing WebSocket connection...');
    setWsStatus("connecting");
    
    // Close existing connection if it exists
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      try {
        wsRef.current.close();
      } catch (e) {
        console.error('Error closing existing WebSocket:', e);
      }
    }
    
    try {
      // Create new WebSocket with error handling
      const socket = new WebSocket('ws://localhost:4000');
      wsRef.current = socket;

      // Setup event handlers
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setWsStatus("connected");
        reconnectAttemptRef.current = 0;
        isConnectingRef.current = false;
        
        // Process any queued messages
        processQueue();
        
        // Notify the server about the active file to get the latest content
        if (activeFile) {
          socket.send(JSON.stringify({ 
            type: 'join', 
            fileName: activeFile,
            clientId: clientIdRef.current
          }));
          
          // Also request current content
          socket.send(JSON.stringify({
            type: 'getContent',
            fileName: activeFile,
            clientId: clientIdRef.current
          }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          if (data.type === 'update' && data.fileName && data.content) {
            if (activeFile === data.fileName) {
              console.log('Updating code with received content');
              // Skip if this update is our own
              if (data.clientId === clientIdRef.current) {
                console.log('Skipping our own update');
                return;
              }
              
              // Prevent echo by marking we're receiving external changes
              receivingExternalChangesRef.current = true;
              
              setCode(data.content);
              lastContentRef.current = data.content;
              
              // Also update the open files to keep everything in sync
              setOpenFiles((files) => {
                const fileExists = files.some(file => file.name === data.fileName);
                
                if (fileExists) {
                  return files.map((file) =>
                    file.name === data.fileName ? { ...file, content: data.content } : file
                  );
                } else {
                  // Add file if it doesn't exist
                  return [...files, { name: data.fileName, content: data.content }];
                }
              });
              
              // Reset the receiving flag after a short delay
              setTimeout(() => {
                receivingExternalChangesRef.current = false;
              }, 100);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsStatus("error");
        // Let onclose handle reconnection
      };

      socket.onclose = (event) => {
        console.log('WebSocket connection closed', event);
        setWsStatus("disconnected");
        wsRef.current = null;
        isConnectingRef.current = false;
        
        // Don't try to reconnect if closed normally
        if (event.wasClean) {
          console.log('Clean WebSocket closure, not reconnecting');
          return;
        }
        
        // Attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptRef.current), 10000);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptRef.current + 1}/${maxReconnectAttempts})`);
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current += 1;
            connectWebSocket();
          }, delay);
        } else {
          console.log('Maximum reconnection attempts reached');
          setWsStatus("failed");
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setWsStatus("error");
      isConnectingRef.current = false;
      
      // Schedule reconnect
      if (reconnectAttemptRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptRef.current), 10000);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptRef.current += 1;
          connectWebSocket();
        }, delay);
      }
    }
  };

  // Function to process the message queue
  const processQueue = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log('Cannot process queue: WebSocket not open');
      return;
    }
    
    if (messageQueueRef.current.length > 0) {
      console.log(`Processing ${messageQueueRef.current.length} queued messages`);
      const messagesToProcess = [...messageQueueRef.current];
      messageQueueRef.current = [];
      
      // Only send the latest message for each file to avoid overwhelming the server
      const latestMessages = new Map();
      for (const msg of messagesToProcess) {
        if (msg.type === 'update') {
          latestMessages.set(msg.fileName, msg);
        } else {
          // For non-update messages, always process them
          try {
            wsRef.current.send(JSON.stringify(msg));
          } catch (error) {
            console.error('Error sending queued message:', error);
            messageQueueRef.current.push(msg);
          }
        }
      }
      
      // Send the latest update for each file
      for (const msg of latestMessages.values()) {
        try {
          wsRef.current.send(JSON.stringify(msg));
          console.log('Sent queued message for:', msg.fileName);
        } catch (error) {
          console.error('Error sending queued message:', error);
          messageQueueRef.current.push(msg);
        }
      }
    }
  };

  // Function to safely send messages with queueing and aggregation
  const sendMessage = (message: any) => {
    // Add clientId to identify this client
    const messageWithId = {
      ...message,
      clientId: clientIdRef.current
    };
    
    // For update messages, check for duplicate content
    if (message.type === 'update') {
      if (lastContentRef.current === message.content) {
        return false;
      }
      lastContentRef.current = message.content;
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(messageWithId));
        console.log('Sent WebSocket message:', message.type, message.fileName);
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        messageQueueRef.current.push(messageWithId);
        
        // Try to reconnect if sending fails
        if (wsRef.current.readyState !== WebSocket.OPEN) {
          reconnectIfNeeded();
        }
        return false;
      }
    } else {
      console.log(`WebSocket not ready. State: ${wsRef.current?.readyState}. Queueing message.`);
      
      // For updates, filter out older messages for the same file before adding the new one
      if (message.type === 'update') {
        messageQueueRef.current = messageQueueRef.current.filter(
          msg => !(msg.type === 'update' && msg.fileName === message.fileName)
        );
      }
      
      messageQueueRef.current.push(messageWithId);
      
      // Try to reconnect if not already connecting
      reconnectIfNeeded();
      return false;
    }
  };
  // Helper function to trigger reconnection if needed
  const reconnectIfNeeded = () => {
    if (!isConnectingRef.current && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Schedule immediate reconnect
      setTimeout(() => {
        connectWebSocket();
      }, 100);
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);
  
  // Handle active file changes
  useEffect(() => {
    if (activeFile) {
      // Load file content from openFiles
      const file = openFiles.find(f => f.name === activeFile);
      if (file) {
        setCode(file.content);
        lastContentRef.current = file.content;
      }
      
      // Subscribe to updates for this file
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Notify server about file change to join that file's updates
        sendMessage({ 
          type: 'join', 
          fileName: activeFile 
        });
        
        // Request current content
        sendMessage({
          type: 'getContent',
          fileName: activeFile
        });
      }
    }
  }, [activeFile]);

  // Load active file content
  useEffect(() => {
    const activeFileName = localStorage.getItem("activeFile");
    if (activeFileName) {
      setActiveFile(activeFileName);
      const file = openFiles.find(f => f.name === activeFileName);
      if (file) {
        const newContent = file.content;
        setCode(newContent);
        lastContentRef.current = newContent;
      }
    }
  }, []);

  // Save open files to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("openFiles", JSON.stringify(openFiles));
  }, [openFiles]);

  // Save active file to localStorage whenever it changes
  useEffect(() => {
    if (activeFile) {
      localStorage.setItem("activeFile", activeFile);
    }
  }, [activeFile]);

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorInstanceRef.current = editor;
  };

  // Debounced editor content change handler
  const handleEditorChange = (value = "") => {
    // Skip if this change is from an external source
    if (receivingExternalChangesRef.current) {
      console.log('Skipping local update due to external changes');
      return;
    }
    
    setCode(value);
    
    if (activeFile) {
      // Update local state immediately
      setOpenFiles((files) => {
        const fileExists = files.some(file => file.name === activeFile);
        
        if (fileExists) {
          return files.map((file) =>
            file.name === activeFile ? { ...file, content: value } : file
          );
        } else {
          // Add file if it doesn't exist
          return [...files, { name: activeFile, content: value }];
        }
      });

      // Debounce network sends to avoid overwhelming the connection
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        // Send to server if connected, or queue if not
        sendMessage({
          type: 'update',
          fileName: activeFile,
          content: value
        });
      }, 300); // 300ms debounce
    }
  };

  return (
    <div className="editor-container">
      {wsStatus !== "connected" && (
        <div className={`websocket-status ${wsStatus}`} style={{
          padding: "6px 12px",
          backgroundColor: wsStatus === "connecting" ? "#ffd700" : 
                          wsStatus === "error" || wsStatus === "failed" ? "#ff6b6b" : "#f8f9fa",
          color: wsStatus === "connecting" ? "#333" : 
                wsStatus === "error" || wsStatus === "failed" ? "white" : "#333",
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 100,
          borderRadius: "4px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span>WebSocket: {wsStatus}</span>
          {(wsStatus === "failed" || wsStatus === "error" || wsStatus === "disconnected") && (
            <button 
              onClick={() => {
                reconnectAttemptRef.current = 0;
                connectWebSocket();
              }}
              style={{
                backgroundColor: "#4285f4",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Reconnect
            </button>
          )}
        </div>
      )}
      
      <Editor
        height="90vh"
        defaultLanguage="javascript"
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 14
        }}
      />
    </div>
  );
};

export default CodeEditor;