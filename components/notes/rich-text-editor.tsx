"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Heading1, Heading2,Quote,
  Undo, Redo, Eraser,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-white/5 p-2.5 bg-background/80 backdrop-blur-xl sticky top-0 z-20 shadow-sm cursor-default">
      {/* History */}
      <div className="flex items-center gap-1 pr-3 border-r border-white/10">
        <TabButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo className="h-4 w-4" /></TabButton>
        <TabButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo className="h-4 w-4" /></TabButton>
      </div>

      {/* Formatting */}
      <div className="flex items-center gap-1 pr-3 border-r border-white/10">
        <TabButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold className="h-4 w-4" /></TabButton>
        <TabButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic className="h-4 w-4" /></TabButton>
        <TabButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}><UnderlineIcon className="h-4 w-4" /></TabButton>
        <TabButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}><Strikethrough className="h-4 w-4" /></TabButton>
        <TabButton onClick={() => editor.chain().focus().unsetAllMarks().run()}><Eraser className="h-4 w-4" /></TabButton>
      </div>
      
      {/* Headings */}
      <div className="flex items-center gap-1 pr-3 border-r border-white/10">
        <TabButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}><Heading1 className="h-4 w-4" /></TabButton>
        <TabButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}><Heading2 className="h-4 w-4" /></TabButton>
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
        // Kept clean, moved padding and height to the CSS block for strict enforcement
        className: 'focus:outline-none outline-none border-none prose-p:my-2 text-base text-foreground/90 leading-relaxed',
      },
    },
  });

  return (
    <div className="premium-editor relative border border-white/10 rounded-2xl overflow-hidden bg-secondary/10 shadow-inner flex flex-col">
      
      {/* PREMIUM SCOPED CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        /* KILL BROWSER FOCUS RINGS COMPLETELY */
        .premium-editor .tiptap:focus,
        .premium-editor .ProseMirror:focus,
        .premium-editor .ProseMirror-focused {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }

        /* FORCE PADDING AND HEIGHT SO IT NEVER TOUCHES THE EDGES */
        .premium-editor .ProseMirror {
          padding: 1rem !important; /* Forces 32px top/bottom and 40px left/right padding */
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

      {/* CHANGED: Added cursor-text and onClick handler so clicking ANYWHERE in this box focuses the editor */}
      <div 
        className="flex-1 custom-scrollbar overflow-y-auto  min-h-[275px] cursor-text"
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