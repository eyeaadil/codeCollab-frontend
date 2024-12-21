import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import { Users } from "lucide-react";

const socket = io("http://localhost:3000"); // Replace with your WebSocket server URL

export const CodeEditor = () => {
  const [code, setCode] = useState("// Start coding here...");
  const [activeUsers, setActiveUsers] = useState(1);

  useEffect(() => {
    socket.on("codeChange", (newCode) => {
      setCode(newCode);
    });

    socket.on("userCount", (count) => {
      setActiveUsers(count);
    });

    return () => {
      socket.off("codeChange");
      socket.off("userCount");
    };
  }, []);

  const handleEditorChange = (value: string = "") => {
    setCode(value);
    socket.emit("codeChange", value);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full w-full relative"
    >
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-editor-bg/50 backdrop-blur-sm px-4 py-2 rounded-full">
        <Users className="w-4 h-4 text-editor-accent" />
        <span className="text-editor-text text-sm">{activeUsers} online</span>
      </div>
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
    </motion.div>
  );
};