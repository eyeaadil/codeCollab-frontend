import { motion } from "framer-motion";
import { CodeEditor } from "./CodeEditor";
// import FileExplorer from "./FileExplorer";
// import FileExplorer from "./CodeEditor";
// import { FileExplorer } from "./CodeEditor";

// import { FolderList } from "./FolderList";
import FileList from "./FileList";
import FolderList from "./FolderList";
// import FileExplorer from "./FileExplorer";
export const Dashboard = () => {
  return (
    <div className="h-[887px] bg-editor-bg text-editor-text">
      {/* Main content */}
      <main className=" px-4 py-[30px] h-full w-full bg-yellow-500"> {/* Changed w-[90vw] to w-full */}
        <div className=" h-full w-full border:3px solid white" style={{ border:"3px solid red"}}> {/* Changed w-[80vw] to w-full */}
          {/* <FileExplorer /> */}
          <CodeEditor />
          {/* <FolderList /> */}
          {/* <FileList /> */}
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
