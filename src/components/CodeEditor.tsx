// components/CodeEditor.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Users } from "lucide-react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useParams, useNavigate } from 'react-router-dom';
import * as monaco from 'monaco-editor';
import { InviteModal } from "./InviteModal";
import { Notification } from "./Notification";
import { ChevronDown, ChevronRight, Play, Terminal } from 'lucide-react';
import axios from 'axios';

interface UpdateMessage {
  roomId: string; // Changed from fileName
  content?: string;
  isInitialLoad?: boolean;
  isResponse?: boolean;
  senderId?: string;
}
interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const CodeEditor = () => {
  const [code, setCode] = useState("// Start coding here...");
  const { roomId } = useParams<{ roomId: string }>();
  const [activeFile, setActiveFile] = useState(roomId);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const receivingExternalChangesRef = useRef(false);
  const initialContentLoadedRef = useRef(false);
  const lastSentContentRef = useRef("");
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const navigate = useNavigate();
  const [output, setOutput] = useState<string>('');
  const [errorOutput, setErrorOutput] = useState<string>('');
  const [showOutput, setShowOutput] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');

  // Get token from cookies
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('access_token='))
    ?.split('=')[1];

  const { wsStatus, sendMessage, reconnect, clientId, addMessageHandler, isConnected } = useWebSocket(
    `ws://localhost:4000?token=${token}`
  );

  const debugLog = useCallback((message: string, data?: unknown) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] CodeEditor: ${message}`);
    if (data) console.log(`[${timestamp}] CodeEditor Data:`, data);
  }, []);

  useEffect(() => {
    if (!token) {
      debugLog('No token found, redirecting to signin');
      navigate(`/signin?roomId=${roomId}`);
    }
  }, [token, roomId, navigate, debugLog]);

  useEffect(() => {
    if (activeFile && wsStatus === "connected") {
      debugLog(`Joining room: ${activeFile}`);
      initialContentLoadedRef.current = false;
      sendMessage({ type: "join", roomId: activeFile });
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
            debugLog(`Joined room: ${data.roomId}, subscribers: ${data.subscriberCount}`);
            break;
          case "update":
            handleUpdateMessage(data);
            break;
          case "error":
            debugLog(`Server error: ${data.message}`);
            setNotification({ message: `Server error: ${data.message}`, type: 'error', onClose: () => setNotification(null) });
            if (data.message.includes('Unauthorized')) {
              navigate(`/signin?roomId=${roomId}`);
            }
            break;
          default:
            debugLog(`Unknown message type: ${data.type}`);
        }
      } catch (error) {
        debugLog(`Error processing message: ${error}`);
      }
    });
    return removeHandler;
  }, [clientId, activeFile, addMessageHandler, debugLog, navigate, roomId]);

  const handleUpdateMessage = useCallback((data: UpdateMessage) => {
    if (data.roomId !== activeFile) return;
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
    if (activeFile && isConnected && value !== lastSentContentRef.current) {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => {
        debugLog(`Sending update for ${activeFile}`);
        sendMessage({ type: "update", roomId: activeFile, content: value });
        lastSentContentRef.current = value;
      }, 150);
    }
  }, [activeFile, isConnected, sendMessage, debugLog]);

  const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
    debugLog('Editor mounted');
    editorRef.current = editor;
    editor.focus();
    // Set initial language from editor instance if available
    const model = editor.getModel();
    if (model) {
      setSelectedLanguage(model.getLanguageId());
    }
  }, [debugLog]);

  const handleRunCode = async () => {
    if (!editorRef.current) {
      setNotification({ message: 'Editor not ready.', type: 'error', onClose: () => setNotification(null) });
      return;
    }

    console.log("currentCodeaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    const currentCode = editorRef.current.getValue();
    console.log("currentCode", currentCode);
    if (!currentCode.trim()) {
      setNotification({ message: 'Please enter code to run.', type: 'error', onClose: () => setNotification(null) });
      return;
    }

    setOutput('Running code...');
    setErrorOutput('');
    setShowOutput(true);

    try {
      console.log("currentCode");
      const response = await axios.post('http://localhost:5000/api/execute-code/run-code', {
        language: selectedLanguage,
        code: currentCode,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log("response", response);

      const data = response.data;
      if (response.status === 200 && data.success) {
        setOutput(data.output || '(No output)');
        setErrorOutput(data.error || '');
        if (data.error) {
          setNotification({ message: 'Code executed with errors.', type: 'error', onClose: () => setNotification(null) });
        } else {
          setNotification({ message: 'Code executed successfully.', type: 'success', onClose: () => setNotification(null) });
        }
      } else {
        throw new Error(data.message || 'Failed to execute code.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during execution.';
      console.error('Code execution error:', error);
      setOutput('');
      setErrorOutput(errorMessage);
      setNotification({ message: `Execution failed: ${errorMessage}`, type: 'error', onClose: () => setNotification(null) });
    }
  };

  const handleSendInvite = async () => {
    if (!collaboratorEmail.trim() || !activeFile) {
      setNotification({ message: 'Invalid email or no active room', type: 'error', onClose: () => setNotification(null) });
      return;
    }
    try {
      const response = await axios.post("http://localhost:5000/api/collaborate/invite", {
        senderId: clientId,
        receiverEmail: collaboratorEmail,
        roomId: activeFile
      }, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = response.data;
      if (response.status !== 200) throw new Error(data.message || 'Failed to send invite');
      setNotification({ message: `Invite sent to ${collaboratorEmail}`, type: 'success', onClose: () => setNotification(null) });
      setCollaboratorEmail("");
      setShowInviteModal(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invite';
      debugLog(`Invite error: ${errorMessage}`);
      setNotification({ message: errorMessage, type: 'error', onClose: () => setNotification(null) });
    }
  };

  return (
    <div className="h-screen w-full flex bg-gray-900 text-white">
      <div className="w-full flex flex-col">
        <div className="bg-gray-800 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">{activeFile ? `Room: ${activeFile}` : "Real-Time Code Editor"}</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowInviteModal(true)} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex gap-2">
              Invite <Users className="w-5 h-5" />
            </button>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded focus:outline-none"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
            </select>
            <button onClick={handleRunCode} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex gap-2">
              Run <Play className="w-5 h-5" />
            </button>
          </div>
        </div>
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language={selectedLanguage} // Set language dynamically
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
        {showOutput && (
          <div className="bg-gray-800 p-4 border-t border-gray-700 mt-2">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowOutput(!showOutput)}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Terminal className="w-5 h-5" /> Output
              </h2>
              {showOutput ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
            {showOutput && (
              <div className="mt-2 bg-gray-900 p-3 rounded text-sm overflow-auto max-h-48">
                {output && <pre className="text-green-300 whitespace-pre-wrap">{output}</pre>}
                {errorOutput && <pre className="text-red-400 whitespace-pre-wrap">{errorOutput}</pre>}
                {!output && !errorOutput && <p className="text-gray-500">No output yet.</p>}
              </div>
            )}
          </div>
        )}
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