import { useState, useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Users, Terminal, Play, ChevronDown, ChevronRight } from "lucide-react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useParams, useNavigate } from 'react-router-dom';
import * as monaco from 'monaco-editor';
import { InviteModal } from "./InviteModal";
import { Notification } from "./Notification";
import axios from 'axios';

interface UpdateMessage {
  roomId: string;
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
  const [terminalHistory, setTerminalHistory] = useState<{ type: 'input' | 'output' | 'error' | 'prompt'; value: string }[]>([]);
  const [showOutput, setShowOutput] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [waitingForInput, setWaitingForInput] = useState<boolean>(false);
  const [inputCount, setInputCount] = useState<number>(0);
  const [currentInputIndex, setCurrentInputIndex] = useState<number>(0);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('access_token='))
    ?.split('=')[1];

  const { wsStatus, sendMessage, reconnect, clientId, addMessageHandler, isConnected } = useWebSocket(
    `wss://codecollab-backend-1.onrender.com/ws?token=${token}`
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
          case "execution_start":
            setIsExecuting(true);
            setShowOutput(true);
            setTerminalHistory((prev) => [...prev, { type: 'output', value: 'Running code...' }]);
            break;
          case "input_request":
            setWaitingForInput(true);
            setCurrentInputIndex(data.inputIndex || 0);
            setTerminalHistory((prev) => [...prev, { type: 'prompt', value: data.prompt || `Enter input ${data.inputIndex + 1}:` }]);
            if (terminalInputRef.current) {
              terminalInputRef.current.focus();
            }
            break;
          case "execution_result":
            setWaitingForInput(false);
            if (data.output !== undefined) {
              setTerminalHistory((prev) => [...prev, { type: 'output', value: data.output }]);
            }
            if (data.error !== undefined) {
              setTerminalHistory((prev) => [...prev, { type: 'error', value: data.error }]);
            }
            if (data.error) {
              setNotification({ message: 'Code executed with errors.', type: 'error', onClose: () => setNotification(null) });
            } else {
              setNotification({ message: 'Code executed successfully.', type: 'success', onClose: () => setNotification(null) });
            }
            setIsExecuting(false);
            break;
          case "language_change":
            if (data.language) {
              setSelectedLanguage(data.language);
            }
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
    const model = editor.getModel();
    if (model) {
      setSelectedLanguage(model.getLanguageId());
    }
  }, [debugLog]);

  const detectInputFunctions = (code: string, language: string): number => {
    let inputFunctionRegex: RegExp;
    switch (language) {
      case 'python':
        inputFunctionRegex = /input\s*\(/g;
        break;
      case 'cpp':
        inputFunctionRegex = /cin\s*>>/g;
        break;
      case 'c':
        inputFunctionRegex = /scanf\s*\(/g;
        break;
      case 'java':
        inputFunctionRegex = /Scanner\s*\.\s*next/g;
        break;
      case 'javascript':
        inputFunctionRegex = /prompt\s*\(/g;
        break;
      default:
        return 0;
    }
    const matches = code.match(inputFunctionRegex);
    return matches ? matches.length : 0;
  };

  const handleRunCode = async () => {
    if (!editorRef.current) {
      setNotification({ message: 'Editor not ready.', type: 'error', onClose: () => setNotification(null) });
      return;
    }

    const currentCode = editorRef.current.getValue();
    setInputCount(detectInputFunctions(currentCode, selectedLanguage));
    setCurrentInputIndex(0);
    setTerminalHistory([]);
    setWaitingForInput(false);
    setCurrentInput("");
    setShowOutput(true);
    setIsExecuting(true);
    sendMessage({ type: "execution_start", roomId: activeFile, senderId: clientId });

    try {
      const response = await axios.post('https://codecollab-backend-1.onrender.com/api/execute-code/run-code', {
        language: selectedLanguage,
        code: currentCode,
        inputCount: inputCount,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = response.data;
      if (response.status === 200 && data.success) {
        if (data.inputRequired) {
          setWaitingForInput(true);
          setCurrentInputIndex(data.inputIndex || 0);
          setTerminalHistory((prev) => [...prev, { type: 'prompt', value: data.prompt || `Enter input ${data.inputIndex + 1}:` }]);
          if (terminalInputRef.current) {
            terminalInputRef.current.focus();
          }
        } else {
          setTerminalHistory((prev) => [
            ...prev,
            ...(data.output ? [{ type: 'output', value: data.output }] : []),
            ...(data.error ? [{ type: 'error', value: data.error }] : []),
          ]);
          if (data.error) {
            setNotification({ message: 'Code executed with errors.', type: 'error', onClose: () => setNotification(null) });
          } else {
            setNotification({ message: 'Code executed successfully.', type: 'success', onClose: () => setNotification(null) });
          }
          sendMessage({ type: "execution_result", roomId: activeFile, output: data.output, error: data.error, exitCode: data.exitCode });
          setIsExecuting(false);
        }
      } else {
        throw new Error(data.message || 'Failed to execute code.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during execution.';
      console.error('Code execution error:', error);
      setTerminalHistory((prev) => [...prev, { type: 'error', value: errorMessage }]);
      setNotification({ message: `Execution failed: ${errorMessage}`, type: 'error', onClose: () => setNotification(null) });
      sendMessage({ type: "execution_result", roomId: activeFile, output: '', error: errorMessage, exitCode: 1 });
      setIsExecuting(false);
    }
  };

  const handleInputSubmit = async (input: string) => {
    if (!waitingForInput) return;

    setTerminalHistory((prev) => [...prev, { type: 'input', value: input }]);
    setCurrentInput("");
    setWaitingForInput(false);

    try {
      const response = await axios.post('https://codecollab-backend-1.onrender.com/api/execute-code/provide-input', {
        roomId: activeFile,
        input,
        inputIndex: currentInputIndex,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = response.data;
      if (response.status === 200 && data.success) {
        if (data.inputRequired) {
          setWaitingForInput(true);
          setCurrentInputIndex(data.inputIndex || currentInputIndex + 1);
          setTerminalHistory((prev) => [...prev, { type: 'prompt', value: data.prompt || `Enter input ${data.inputIndex + 1}:` }]);
          if (terminalInputRef.current) {
            terminalInputRef.current.focus();
          }
        } else {
          setTerminalHistory((prev) => [
            ...prev,
            ...(data.output ? [{ type: 'output', value: data.output }] : []),
            ...(data.error ? [{ type: 'error', value: data.error }] : []),
          ]);
          if (data.error) {
            setNotification({ message: 'Code executed with errors.', type: 'error', onClose: () => setNotification(null) });
          } else {
            setNotification({ message: 'Code executed successfully.', type: 'success', onClose: () => setNotification(null) });
          }
          sendMessage({ type: "execution_result", roomId: activeFile, output: data.output, error: data.error, exitCode: data.exitCode });
          setIsExecuting(false);
        }
      } else {
        throw new Error(data.message || 'Failed to process input.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while processing input.';
      console.error('Input processing error:', error);
      setTerminalHistory((prev) => [...prev, { type: 'error', value: errorMessage }]);
      setNotification({ message: `Input processing failed: ${errorMessage}`, type: 'error', onClose: () => setNotification(null) });
      sendMessage({ type: "execution_result", roomId: activeFile, output: '', error: errorMessage, exitCode: 1 });
      setIsExecuting(false);
    }
  };

  const handleSendInvite = async () => {
    if (!collaboratorEmail.trim() || !activeFile) {
      setNotification({ message: 'Invalid email or no active room', type: 'error', onClose: () => setNotification(null) });
      return;
    }
    try {
      const response = await axios.post("https://codecollab-backend-1.onrender.com/api/collaborate/invite", {
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
              onChange={(e) => {
                const newLanguage = e.target.value;
                setSelectedLanguage(newLanguage);
                sendMessage({ type: "language_change", roomId: activeFile, language: newLanguage });
              }}
              className="bg-gray-700 text-white px-3 py-2 rounded focus:outline-none"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
            </select>
            <button onClick={handleRunCode} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex gap-2" disabled={isExecuting}>
              Run <Play className="w-5 h-5" />
            </button>
          </div>
        </div>
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language={selectedLanguage}
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
          <div className="bg-gray-800 p-4 border-t border-gray-700 mt-2 flex flex-col">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowOutput(!showOutput)}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Terminal className="w-5 h-5" /> Terminal
              </h2>
              {showOutput ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
            {showOutput && (
              <div className="mt-2 bg-gray-900 p-3 rounded text-sm overflow-auto max-h-48 flex flex-col gap-1">
                {terminalHistory.map((entry, index) => (
                  <div key={index}>
                    {entry.type === 'prompt' && <pre className="text-blue-300 whitespace-pre-wrap">{entry.value}</pre>}
                    {entry.type === 'input' && <pre className="text-blue-300 whitespace-pre-wrap">&gt; {entry.value}</pre>}
                    {entry.type === 'output' && <pre className="text-green-300 whitespace-pre-wrap">{entry.value}</pre>}
                    {entry.type === 'error' && <pre className="text-red-400 whitespace-pre-wrap">{entry.value}</pre>}
                  </div>
                ))}
                {waitingForInput && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300">&gt;</span>
                    <input
                      ref={terminalInputRef}
                      type="text"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && currentInput.trim()) {
                          handleInputSubmit(currentInput);
                        }
                      }}
                      className="bg-transparent text-white outline-none flex-1"
                      placeholder="Enter input here..."
                      autoFocus
                    />
                  </div>
                )}
                {terminalHistory.length === 0 && !waitingForInput && (
                  <p className="text-gray-500">No output yet.</p>
                )}
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