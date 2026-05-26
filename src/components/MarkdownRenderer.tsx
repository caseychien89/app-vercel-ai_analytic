import React from "react";
import { CheckSquare, Square, Calendar, Hash, FileText, MessageSquare, Award, CheckCircle2, Globe, ArrowRight, User } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

interface Section {
  title: string;
  body: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content based on structural '###' markers
  const rawBlocks = content.split("###");
  const intro = rawBlocks[0].trim();
  const sections: Section[] = [];

  for (let i = 1; i < rawBlocks.length; i++) {
    const block = rawBlocks[i].trim();
    if (!block) continue;
    
    const lines = block.split("\n");
    const title = lines[0].trim();
    const body = lines.slice(1).join("\n").trim();
    
    sections.push({ title, body });
  }

  // Formatting strings with bold expressions **bold**
  const formatText = (text: string) => {
    // Regex to split on **text** but keep separators
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-gray-900 bg-emerald-50 px-1 py-0.5 rounded text-sm select-all">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Icon selector based on section heading keyword / number
  const getSectionIcon = (title: string) => {
    if (title.includes("基本資訊") || title.includes("Meeting Info")) {
      return <Calendar className="w-5 h-5 text-indigo-500" />;
    }
    if (title.includes("核心摘要") || title.includes("Summary")) {
      return <FileText className="w-5 h-5 text-emerald-500" />;
    }
    if (title.includes("討論焦點") || title.includes("Key Discussion")) {
      return <MessageSquare className="w-5 h-5 text-sky-500" />;
    }
    if (title.includes("決議事項") || title.includes("Decisions")) {
      return <Award className="w-5 h-5 text-amber-500" />;
    }
    if (title.includes("待辦清單") || title.includes("Action Items")) {
      return <CheckCircle2 className="w-5 h-5 text-teal-500" />;
    }
    if (title.includes("翻譯對照") || title.includes("Translation")) {
      return <Globe className="w-5 h-5 text-purple-500" />;
    }
    return <Hash className="w-5 h-5 text-gray-400" />;
  };

  // Individual Section Body Parser
  const renderSectionBody = (bodyText: string) => {
    const lines = bodyText.split("\n");
    const elements: React.ReactNode[] = [];
    let listLevel = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        elements.push(<div key={`empty-${index}`} className="h-2" />);
        return;
      }

      // Check for horizontal divider
      if (trimmedLine === "---") {
        elements.push(<hr key={`hr-${index}`} className="my-4 border-gray-100" />);
        return;
      }

      // Check for todo list: - [ ] or - [x]
      const todoMatch = trimmedLine.match(/^[-*]\s+\[([ xX])\]\s+(.*)/);
      if (todoMatch) {
        const checked = todoMatch[1].toLowerCase() === "x";
        const textContent = todoMatch[2];
        
        // Extract assignee inside custom parentheses if any, e.g. "任務 (負責人)"
        const assigneeMatch = textContent.match(/(.*?)\s*\((.*?)\)\s*$/);
        const taskText = assigneeMatch ? assigneeMatch[1] : textContent;
        const assignee = assigneeMatch ? assigneeMatch[2] : null;

        elements.push(
          <div key={`todo-${index}`} className="flex items-start gap-2.5 py-1.5 px-2.5 rounded-lg hover:bg-slate-50 transition-colors">
            {checked ? (
              <CheckSquare className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <Square className="w-4.5 h-4.5 text-gray-400 hover:text-indigo-500 cursor-pointer shrink-0 mt-1" />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 w-full">
              <span className={`text-slate-700 text-sm ${checked ? "line-through text-slate-400" : ""}`}>
                {formatText(taskText)}
              </span>
              {assignee && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0 self-start sm:self-center">
                  <User className="w-3 h-3 text-slate-400" />
                  {assignee}
                </span>
              )}
            </div>
          </div>
        );
        return;
      }

      // Check for regular list items
      const bulletMatch = trimmedLine.match(/^[-*]\s+(.*)/);
      if (bulletMatch) {
        // Calculate indentation
        const leadingM = line.match(/^(\s*)/);
        const indent = leadingM ? leadingM[1].length : 0;
        const textContent = bulletMatch[1];

        elements.push(
          <div
            key={`bullet-${index}`}
            className="flex items-start gap-2 py-1 select-all"
            style={{ paddingLeft: `${indent > 2 ? 1.5 : 0.5}rem` }}
          >
            <span className="text-gray-400 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-slate-700 text-sm">{formatText(textContent)}</span>
          </div>
        );
        return;
      }

      // Check for numbered list items
      const numMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        const num = numMatch[1];
        const textContent = numMatch[2];
        elements.push(
          <div key={`num-${index}`} className="flex items-start gap-2.5 py-1.5 select-all">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs shrink-0 mt-0.5">
              {num}
            </span>
            <span className="text-slate-700 text-sm leading-relaxed">{formatText(textContent)}</span>
          </div>
        );
        return;
      }

      // Check for bold title line like Target Language: "【目標語言：英文 (English)】"
      if (trimmedLine.startsWith("【") && trimmedLine.endsWith("】")) {
        elements.push(
          <div key={`title-badge-${index}`} className="my-3 py-1.5 px-3 bg-purple-50 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 border border-purple-100 uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5" />
            {trimmedLine.slice(1, -1)}
          </div>
        );
        return;
      }

      // Check for nested subheadings or fourth level headers
      if (trimmedLine.startsWith("#### ")) {
        elements.push(
          <h4 key={`h4-${index}`} className="text-sm font-bold text-slate-800 mt-4 mb-2 flex items-center gap-1.5 border-b border-gray-100 pb-1">
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            {trimmedLine.replace("#### ", "")}
          </h4>
        );
        return;
      }

      // Standard plain paragraphs
      elements.push(
        <p key={`p-${index}`} className="text-slate-600 text-sm leading-relaxed py-1 select-all">
          {formatText(trimmedLine)}
        </p>
      );
    });

    return elements;
  };

  return (
    <div className="space-y-6">
      {intro && (
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mb-4">
          <p className="text-sm text-slate-600 leading-relaxed italic">{intro}</p>
        </div>
      )}

      {sections.map((sec, idx) => (
        <div
          id={`result-section-${idx}`}
          key={idx}
          className="bg-white border border-slate-100 shadow-xs rounded-2xl p-5 hover:border-indigo-100/80 hover:shadow-xs transition-all duration-200"
        >
          {/* Card Header */}
          <div className="flex items-center gap-2.5 border-b border-slate-50 pb-3 mb-4">
            <div className="p-1.5 bg-slate-50 rounded-lg">
              {getSectionIcon(sec.title)}
            </div>
            <h3 className="font-semibold text-slate-800 text-[15px] sm:text-base tracking-tight">
              {sec.title}
            </h3>
          </div>

          {/* Card Content Block */}
          <div className="space-y-1">
            {renderSectionBody(sec.body)}
          </div>
        </div>
      ))}
    </div>
  );
}
