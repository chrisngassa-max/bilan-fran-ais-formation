import React, { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Close tooltip when clicking outside (important on mobile)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <span
      ref={containerRef}
      className="relative inline-flex items-center gap-1 group cursor-help"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      <span className="underline decoration-dotted decoration-primary/60 hover:decoration-primary transition-colors font-medium">
        {children}
      </span>
      <HelpCircle className="w-3.5 h-3.5 text-on-surface-variant/60 group-hover:text-primary transition-colors shrink-0" />
      
      {isOpen && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-surface-bright border border-outline-variant text-on-surface text-xs rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="block font-semibold text-primary mb-1">Définition simple :</span>
          <span className="block text-on-surface-variant leading-relaxed">{content}</span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-surface-bright"></span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-outline-variant -z-10 mt-[1px]"></span>
        </span>
      )}
    </span>
  );
}
