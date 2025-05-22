import { useState, useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Users } from "lucide-react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useParams } from 'react-router-dom';
import * as monaco from 'monaco-editor';

interface InviteModalProps {
  show: boolean;
  onClose: () => void;
  email: string;
  onEmailChange: (email: string) => void;
  onSendInvite: () => void;
}

const InviteModal: React.FC<InviteModalProps> = ({ show, onClose, email, onEmailChange, onSendInvite }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Invite Collaborator</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Enter email"
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
        />
        <div className="flex gap-2">
          <button onClick={onSendInvite} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">Send</button>
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">Cancel</button>
        </div>
      </div>
    </div>
  );
};

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`fixed top-4 left-4 p-4 rounded ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white z-50`}>
      {message}
    </div>
  );
};

interface UpdateMessage {
  fileName: string;
  content?: string;
  isInitialLoad?: boolean;
  isResponse?: boolean;
  senderId?: string;
}

export const CodeEditor = () => {
  const [code, setCode] = useState("// Start coding here...");
  const { roomId: fileName } = useParams<{ roomId: string }>();
  const [activeFile, setActiveFile] = useState(fileName);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const receivingExternalChangesRef = useRef(false);
  const initialContentLoadedRef = useRef(false);
  const lastSentContentRef = useRef("");
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const { wsStatus, sendMessage, reconnect, clientId, addMessageHandler, isConnected } = useWebSocket("ws://localhost:4000");

  const debugLog = useCallback((message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] CodeEditor: ${message}`);
    if (data) console.log(`[${timestamp}] CodeEditor Data:`, data);
  }, []);

  useEffect(() => {
    if (activeFile && wsStatus === "connected") {
      debugLog(`Joining file: ${activeFile}`);
      initialContentLoadedRef.current = false;
      sendMessage({ type: "join", fileName: activeFile });
    }
  }, [activeFile, wsStatus, sendMessage, debugLog]);

  useEffect(() => {
    const removeHandler = addMessageHandler((event) => {
      try {
        const data = JSON.parse(event.data);
        debugLog('Received WebSocket message:', data);
        switch (data.type) {
          case "welcome":
            debugLog(`Connected with client ID: ${data.clientId}`);
            break;
          case "joinConfirm":
            debugLog(`Joined file: ${data.fileName}, subscribers: ${data.subscriberCount}`);
            break;
          case "update":
            handleUpdateMessage(data);
            break;
          case "error":
            debugLog(`Server error: ${data.message}`);
            setNotification({ message: `Server error: ${data.message}`, type: 'error', onClose: () => setNotification(null) });
            break;
          default:
            debugLog(`Unknown message type: ${data.type}`);
        }
      } catch (error) {
        debugLog(`Error processing message: ${error}`);
      }
    });
    return removeHandler;
  }, [clientId, activeFile, addMessageHandler, debugLog]);

  const handleUpdateMessage = useCallback((data: UpdateMessage) => {
    if (data.fileName !== activeFile) return;
    if (data.isInitialLoad || data.isResponse || (data.senderId && data.senderId !== clientId)) {
      debugLog(`Applying update: ${data.content?.length || 0} chars`);
      receivingExternalChangesRef.current = true;
      setCode(data.content || "");
      if (data.isInitialLoad) {
        initialContentLoadedRef.current = true;
        lastSentContentRef.current = data.content || "";
      }
      setTimeout(() => {
        receivingExternalChangesRef.current = false;
      }, 100);
    }
  }, [activeFile, clientId, debugLog]);

  const handleEditorChange = useCallback((value: string | undefined = "") => {
    if (receivingExternalChangesRef.current) return;
    debugLog(`Editor changed: ${value.length} chars`);
    setCode(value);
    updatePreview(value);
    if (activeFile && isConnected && value !== lastSentContentRef.current) {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => {
        debugLog(`Sending update for ${activeFile}`);
        sendMessage({ type: "update", fileName: activeFile, content: value });
        lastSentContentRef.current = value;
      }, 150);
    }
  }, [activeFile, isConnected, sendMessage, debugLog]);

  const updatePreview = useCallback((code: string) => {
    if (previewRef.current) {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  }, []);

  const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    debugLog('Editor mounted');
    editorRef.current = editor;
    editor.focus();
  }, [debugLog]);

  const handleManualSync = useCallback(() => {
    if (activeFile && isConnected) {
      debugLog('Manual sync');
      sendMessage({ type: "getContent", fileName: activeFile });
    }
  }, [activeFile, isConnected, sendMessage, debugLog]);

  const testConnection = useCallback(() => {
    debugLog('Testing connection', { wsStatus, isConnected, activeFile, clientId });
    setNotification({ message: `Status: ${wsStatus}, File: ${activeFile}`, type: 'success', onClose: () => setNotification(null) });
  }, [wsStatus, isConnected, activeFile, clientId, debugLog]);

  const handleSendInvite = async () => {
    if (!collaboratorEmail.trim() || !activeFile) {
      setNotification({ message: 'Invalid email or no active file', type: 'error', onClose: () => setNotification(null) });
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/collaborate/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: clientId, receiverEmail: collaboratorEmail, roomId: activeFile }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send invite');
      setNotification({ message: `Invite sent to ${collaboratorEmail}`, type: 'success', onClose: () => setNotification(null) });
      setCollaboratorEmail("");
      setShowInviteModal(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invite';
      debugLog(`Invite error: ${errorMessage}`);
      setNotification({ message: errorMessage, type: 'error', onClose: () => setNotification(null) });
    }
  };

  return (
    <div className="h-screen w-full flex bg-gray-900 text-white">
      <div className="w-full flex flex-col">
        <div className="bg-gray-800 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">{activeFile ? `File: ${activeFile}` : "Real-Time Code Editor"}</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowInviteModal(true)} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex gap-2">
              Invite <Users className="w-5 h-5" />
            </button>
          </div>
        </div>
        <Editor
          height="100%"
          defaultLanguage="html"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            padding: { top: 10 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: "on",
            tabSize: 2,
            wordWrap: "on",
          }}
        />
      </div>
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      <InviteModal show={showInviteModal} onClose={() => setShowInviteModal(false)} email={collaboratorEmail} onEmailChange={setCollaboratorEmail} onSendInvite={handleSendInvite} />
      <div className="absolute top-2 right-2">
        {wsStatus === "connected" && <div className="bg-green-500 px-2 py-0.5 rounded text-sm">🟢 Connected</div>}
        {wsStatus === "connecting" && <div className="bg-yellow-500 px-2 py-0.5 rounded text-sm">🟡 Connecting...</div>}
        {(wsStatus === "disconnected" || wsStatus === "error" || wsStatus === "failed") && (
          <div className="bg-red-500 px-2 py-0.5 rounded text-sm flex gap-2">
            🔴 Disconnected
            <button onClick={reconnect} className="bg-white text-red-500 px-1.5 py-0.5 rounded text-xs">Reconnect</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;