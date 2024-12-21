import { motion } from "framer-motion";
// import { CodeEditor } from "./CodeEditor";
import { Code2, Share2 } from "lucide-react";

export const Dashboard = () => {
  return (
    <div className="min-h-screen bg-editor-bg text-editor-text">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-editor-accent/20 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-6 h-6 text-editor-accent" />
            <span className="font-bold text-xl">CodeCollab</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-editor-accent text-editor-bg hover:bg-editor-accent/90 transition-colors">
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </motion.nav>

      <main className="container mx-auto px-4 py-8">
        <div className="h-[80vh]">
          {/* <CodeEditor /> */}
        </div>
      </main>

      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-editor-accent/5 rounded-full filter blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-editor-secondary/5 rounded-full filter blur-3xl animate-float" style={{ animationDelay: "-3s" }}></div>
      </div>
    </div>
  );
};