import { useEffect, useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { X, Users } from "lucide-react";

export const CodeEditor = () => {
  // Editor state
  const [code, setCode] = useState("// Start coding here...");
  const [activeRoom, setActiveRoom] = useState(null);
  const [roomId, setRoomId] = useState(null);

  // Collaboration state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [collaborators, setCollaborators] = useState([]);
  const [pendingInvites, setPendingInvites] = useState<string[]>([]);

  // WebSocket state from tanzu
  const wsRef = useRef(null);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const messageQueueRef = useRef([]);
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef(null);
  const isConnectingRef = useRef(false);
  const debounceTimeoutRef = useRef(null);
  const lastContentRef = useRef("");
  const clientIdRef = useRef(`client-${Math.random().toString(36).substring(2, 9)}`);
  const receivingExternalChangesRef = useRef(false);

  const connectWebSocket = () => {
    if (isConnectingRef.current) return;

    isConnectingRef.current = true;
    setWsStatus("connecting");

    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
    }

    try {
      const socket = new WebSocket("ws://localhost:4000");
      console.log("Attempting to connect to WebSocket at ws://localhost:4000");
console.log("Attempting to connect to WebSocket at ws://localhost:4000");
      wsRef.current = socket;

      socket.onopen = () => {
        setWsStatus("connected");
        reconnectAttemptRef.current = 0;
        isConnectingRef.current = false;
        processQueue();

        if (roomId) {
          socket.send(JSON.stringify({
            type: "join",
            roomId: roomId,
            clientId: clientIdRef.current,
          }));
          socket.send(JSON.stringify({
            type: "getContent",
            roomId: roomId,
            clientId: clientIdRef.current,
          }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received message:", data);

          if (data.type === "update" && data.roomId === roomId) {
            if (data.clientId === clientIdRef.current) return;

            receivingExternalChangesRef.current = true;
            setCode(data.content);
            lastContentRef.current = data.content;
            setTimeout(() => {
              receivingExternalChangesRef.current = false;
            }, 100);
          } else if (data.type === "collaborators") {
            setCollaborators(data.collaborators);
            setPendingInvites(data.invitedEmails || []);
          } else if (data.type === "invite") {
            setPendingInvites(prev => [...prev, data.email]);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setWsStatus("error");
      };

      socket.onclose = (event) => {
        setWsStatus("disconnected");
        wsRef.current = null;
        isConnectingRef.current = false;

        if (event.wasClean) return;

        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            1000 * Math.pow(1.5, reconnectAttemptRef.current),
            10000
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current += 1;
            connectWebSocket();
          }, delay);
        } else {
          setWsStatus("failed");
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      setWsStatus("error");
      isConnectingRef.current = false;
    }
  };

  const processQueue = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    if (messageQueueRef.current.length > 0) {
      const messagesToProcess = [...messageQueueRef.current];
      messageQueueRef.current = [];

      const latestMessages = new Map();
      for (const msg of messagesToProcess) {
        if (msg.type === "update") {
          latestMessages.set(msg.roomId, msg);
        } else {
          wsRef.current.send(JSON.stringify(msg));
        }
      }

      for (const msg of latestMessages.values()) {
        wsRef.current.send(JSON.stringify(msg));
      }
    }
  };

  const sendMessage = (message) => {
    const messageWithId = {
      ...message,
      clientId: clientIdRef.current,
    };

    if (message.type === "update" && lastContentRef.current === message.content) {
      return false;
    }
    lastContentRef.current = message.content;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(messageWithId));
      return true;
    } else {
      if (message.type === "update") {
        messageQueueRef.current = messageQueueRef.current.filter(
          (msg) => !(msg.type === "update" && msg.roomId === message.roomId)
        );
      }
      messageQueueRef.current.push(messageWithId);
      reconnectIfNeeded();
      return false;
    }
  };

  const reconnectIfNeeded = () => {
    if (
      !isConnectingRef.current &&
      (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)
    ) {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      setTimeout(() => connectWebSocket(), 100);
    }
  };

  // Initialize WebSocket
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Handle room joining
  useEffect(() => {
    if (roomId && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      sendMessage({ type: "join", roomId: roomId });
      sendMessage({ type: "getContent", roomId: roomId });
    }
  }, [roomId]);

  // Handle editor changes
  const handleEditorChange = (value = "") => {
    if (receivingExternalChangesRef.current) return;

    setCode(value);
    if (roomId) {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => {
        sendMessage({
          type: "update",
          roomId: roomId,
          content: value,
        });
      }, 300);
    }
  };

  // Create or join a room
  const handleCreateRoom = () => {
    const newRoomId = `room-${Math.random().toString(36).substring(2, 9)}`;
    setRoomId(newRoomId);
    setActiveRoom(newRoomId);
    setShowInviteModal(true);
  };

  // Send collaboration invite
  const handleSendInvite = async () => {
    if (!collaboratorEmail.trim() || !roomId) return;

    try {
      // Send invite via WebSocket
      const inviteSent = sendMessage({
        type: "invite",
        roomId: roomId,
        email: collaboratorEmail
      });

      if (!inviteSent) {
        throw new Error("Failed to send invite via WebSocket");
      }

      // Send email invitation
      const response = await fetch("/api/collaborate/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: clientIdRef.current,
          receiverEmail: collaboratorEmail,
          roomId: roomId
        }),
      });

      if (response.ok) {
        alert(`Invitation sent to ${collaboratorEmail}`);
        setCollaboratorEmail("");
        setShowInviteModal(false);
      } else {
        throw new Error("Failed to send email invite");
      }
    } catch (error) {
      console.error("Error sending invite:", error);
      alert("Failed to send invitation. Please try again.");
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900 text-white relative">
      {/* WebSocket Status */}
      {wsStatus !== "connected" && (
        <div
          className={`websocket-status ${wsStatus}`}
          style={{
            padding: "6px 12px",
            backgroundColor:
              wsStatus === "connecting"
                ? "#ffd700"
                : wsStatus === "error" || wsStatus === "failed"
                ? "#ff6b6b"
                : "#f8f9fa",
            color:
              wsStatus === "connecting"
                ? "#333"
                : wsStatus === "error" || wsStatus === "failed"
                ? "white"
                : "#333",
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 100,
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>WebSocket: {wsStatus}</span>
          {(wsStatus === "failed" ||
            wsStatus === "error" ||
            wsStatus === "disconnected") && (
            <button
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2"
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
                cursor: "pointer",
              }}
            >
              Reconnect
            </button>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {activeRoom ? `Room: ${activeRoom}` : "Real-Time Code Editor"}
        </h1>
        <div className="flex items-center gap-4">
          {collaborators.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{collaborators.length} Collaborator(s)</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2"
              onClick={handleCreateRoom}
            >
              Invite Collaborator
              <Users className="w-5 h-5" />
            </button>
            {pendingInvites.length > 0 && (
              <div className="relative">
                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                  {pendingInvites.length}
                </div>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            padding: { top: 10 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: "on",
            tabSize: 2,
          }}
        />
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Invite Collaborator</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="email"
              value={collaboratorEmail}
              onChange={(e) => setCollaboratorEmail(e.target.value)}
              placeholder="Enter collaborator's email"
              className="w-full px-3 py-2 bg-gray-700 rounded text-white mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Send Collaboration Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
