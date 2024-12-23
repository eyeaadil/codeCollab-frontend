import { motion } from "framer-motion";
// import { CodeEditor } from "./CodeEditor";

export const Dashboard = () => {
  return (
    <div className="min-h-screen bg-editor-bg text-editor-text">
      {/* Main content */}
      <main className="container mx-auto px-4 py-32">
        <div className="h-[80vh]">
          {/* <CodeEditor /> */}
        </div>
      </main>

      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-editor-accent/5 rounded-full filter blur-3xl animate-float"></div>
        <div
          className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-editor-secondary/5 rounded-full filter blur-3xl animate-float"
          style={{ animationDelay: "-3s" }}
        ></div>
      </div>
    </div>
  );
};
