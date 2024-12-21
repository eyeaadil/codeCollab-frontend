import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Code2, Users, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-editor-bg">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-editor-accent/20 to-transparent rounded-full animate-spin-slow"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-editor-secondary/20 to-transparent rounded-full animate-spin-slow"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-editor-text">
            Code Together,{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-editor-accent to-editor-secondary">
              Create Together
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-xl text-editor-text/80 mb-12"
          >
            Experience real-time collaborative coding with our powerful editor.
            Write, share, and build amazing projects together.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-wrap gap-6 justify-center"
          >
            <Link
              to="/dashboard"
              className="group relative px-8 py-4 bg-gradient-to-r from-editor-accent to-editor-secondary rounded-xl text-editor-bg font-semibold shadow-lg hover:shadow-editor-accent/50 transition-all duration-300"
            >
              Start Coding
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-20"
        >
          {[
            {
              icon: Code2,
              title: "Real-time Editing",
              description: "See changes as they happen. Code together in perfect sync.",
            },
            {
              icon: Users,
              title: "Team Collaboration",
              description: "Invite teammates and code together seamlessly.",
            },
            {
              icon: Zap,
              title: "Instant Preview",
              description: "See your code come to life with live preview.",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.2, duration: 0.8 }}
              className="group relative"
            >
              <div className="relative flex flex-col items-center text-center p-8 bg-editor-accent/5 backdrop-blur-sm rounded-2xl border border-editor-accent/20 hover:border-editor-accent/40 transition-all duration-300">
                <feature.icon className="w-12 h-12 mb-4 text-editor-accent" />
                <h3 className="text-xl font-semibold mb-3 text-editor-text">
                  {feature.title}
                </h3>
                <p className="text-editor-text/80">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Index;