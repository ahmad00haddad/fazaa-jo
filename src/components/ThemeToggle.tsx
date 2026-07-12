import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileTap={{ scale: 0.88, rotate: 15 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      onClick={toggleTheme}
      className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
        theme === "dark"
          ? "bg-white/10 text-yellow-300 border border-white/10"
          : "bg-primary/8 text-primary border border-primary/15"
      } ${className}`}
      aria-label={theme === "dark" ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
    >
      <AnimatePresence mode="wait">
        {theme === "dark" ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-4.5 h-4.5" strokeWidth={1.8} />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-4.5 h-4.5" strokeWidth={1.8} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
