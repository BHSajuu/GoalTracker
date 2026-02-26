"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {TextStyle} from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote,
  Undo, Redo
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});

// Helper component for identical button styling
const TabButton = ({ 
  onClick, isActive, disabled, children, className 
}: { 
  onClick: () => void, isActive?: boolean, disabled?: boolean, children: React.ReactNode, className?: string 
}) => (
  <button
    type="button"
    onClick={(e) => { e.preventDefault(); onClick(); }}
    disabled={disabled}
    className={cn(
      "h-8 w-8 flex items-center justify-center rounded-md transition-all duration-200",
      isActive 
        ? "bg-primary/20 text-primary shadow-sm ring-1 ring-primary/30" 
        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}
  >
    {children}
  </button>
);

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  // Get current font size or fallback to '16px' (Normal)
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '16px';

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-white/5 p-2.5 bg-background/80 backdrop-blur-xl sticky top-0 z-20 shadow-sm cursor-default">
      {/* History */}
      <div className="flex items-center gap-1 pr-3 border-r border-white/10">
        <TabButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo className="h-4 w-4" /></TabButton>
        <TabButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo className="h-4 w-4" /></TabButton>
      </div>

      {/* Font Size Dropdown */}
      <div className="flex items-center gap-1 pr-3 border-r border-white/10">
        <select
          className="h-8 bg-transparent text-sm font-medium border border-transparent hover:bg-secondary/80 rounded-md px-2 text-muted-foreground hover:text-foreground focus:outline-none transition-all cursor-pointer"
          value={currentFontSize}
          onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
        >
          <option value="12px" className="bg-background text-foreground">12px</option>
          <option value="14px" className="bg-background text-foreground">14px</option>
          <option value="16px" className="bg-background text-foreground">Normal</option>
          <option value="18px" className="bg-background text-foreground">18px</option>
          <option value="20px" className="bg-background text-foreground">20px</option>
          <option value="24px" className="bg-background text-foreground">24px</option>
          <option value="30px" className="bg-background text-foreground">30px</option>
        </select>
      </div>

      {/* Formatting */}
      <div className="flex items-center gap-1 pr-3 border-r border-white/10">
        <TabButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold className="h-4 w-4" /></TabButton>
        <TabButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic className="h-4 w-4" /></TabButton>
        <TabButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}><UnderlineIcon className="h-4 w-4" /></TabButton>
        <TabButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}><Strikethrough className="h-4 w-4" /></TabButton>
      </div>
      
      {/* Lists & Blocks */}
      <div className="flex items-center gap-1">
        <TabButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}><List className="h-4 w-4" /></TabButton>
        <TabButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}><ListOrdered className="h-4 w-4" /></TabButton>
        <TabButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')}><Quote className="h-4 w-4" /></TabButton>
      </div>
    </div>
  );
};

export function RichTextEditor({ 
  content, 
  onChange 
}: { 
  content: string; 
  onChange: (content: string) => void 
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'custom-code-block' } },
      }),
      Underline,
      TextStyle, // Required for inline styles
      FontSize,  // Our custom extension
      Placeholder.configure({
        placeholder: 'What are you thinking? Start writing your amazing note...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: content,
    immediatelyRender: false, 
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        className: 'focus:outline-none outline-none border-none prose-p:my-2 text-base text-foreground/90 leading-relaxed',
      },
    },
  });


  // Force Tiptap to update its content if the external `content` prop changes
  useEffect(() => {
    if (editor && content !== undefined && !editor.isDestroyed) {
      const currentContent = editor.getHTML();
      // Only update if the content actually differs to avoid resetting cursor position while typing
      if (content !== currentContent && content !== "<p></p>") {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  return (
    <div className="premium-editor relative border border-white/10 rounded-2xl overflow-hidden bg-secondary/10 shadow-inner flex flex-col">
      
      {/* PREMIUM SCOPED CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .premium-editor .tiptap:focus,
        .premium-editor .ProseMirror:focus,
        .premium-editor .ProseMirror-focused {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }

        .premium-editor .ProseMirror {
          padding: 1rem !important; 
          min-height: 275px !important;
          height: 100%;
        }

        /* PLACEHOLDER STYLING */
        .premium-editor .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #71717a; 
          pointer-events: none;
          height: 0;
          font-style: normal;
        }

        /* PERFECT LISTS */
        .premium-editor .tiptap ul {
          list-style-type: disc !important;
          padding-left: 1.75rem !important;
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .premium-editor .tiptap ol {
          list-style-type: decimal !important;
          padding-left: 1.75rem !important;
          margin-top: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .premium-editor .tiptap li {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
        .premium-editor .tiptap li p {
          margin: 0;
          display: inline;
        }

        /* PREMIUM TYPOGRAPHY */
        .premium-editor .tiptap h1 {
          font-size: 2rem;
          font-weight: 800;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #ffffff;
          letter-spacing: -0.025em;
        }
        .premium-editor .tiptap h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #f4f4f5;
          letter-spacing: -0.025em;
        }
        
        /* GORGEOUS BLOCKQUOTES */
        .premium-editor .tiptap blockquote {
          border-left: 4px solid #3b82f6;
          margin-left: 0;
          margin-top: 1.25rem;
          margin-bottom: 1.25rem;
          padding: 0.75rem 1.25rem;
          color: #a1a1aa;
          font-style: italic;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0) 100%);
          border-radius: 0 0.5rem 0.5rem 0;
        }

        /* INLINE CODE & CODE BLOCKS */
        .premium-editor .tiptap code {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 0.2em 0.4em;
          border-radius: 0.375rem;
          font-size: 0.875em;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          color: #60a5fa;
        }
        .premium-editor .tiptap pre {
          background: #09090b;
          color: #e4e4e7;
          padding: 1.25rem;
          border-radius: 0.75rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
          overflow-x: auto;
          margin-top: 1.25rem;
          margin-bottom: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
        }
        .premium-editor .tiptap pre code {
          background: transparent;
          color: inherit;
          padding: 0;
          border-radius: 0;
        }
      `}} />

      <MenuBar editor={editor} />

      <div 
        className="flex-1 custom-scrollbar overflow-y-auto min-h-[275px] cursor-text"
        onClick={() => {
          if (editor && !editor.isFocused) {
            editor.chain().focus().run();
          }
        }}
      >
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}