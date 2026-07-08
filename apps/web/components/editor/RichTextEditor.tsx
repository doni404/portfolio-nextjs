"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { createLowlight, common } from "lowlight";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link2,
  Link2Off,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Minus,
  Code2,
  Type,
} from "lucide-react";

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors",
        "disabled:pointer-events-none disabled:opacity-30",
        active
          ? "bg-blue-100 text-blue-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-slate-200" />;
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function EditorToolbar({ editor }: { editor: Editor }) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);

  const setLink = useCallback(() => {
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run();
      setShowLinkInput(false);
      return;
    }
    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
    editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const insertImage = useCallback(() => {
    if (!imageUrl.trim()) {
      setShowImageInput(false);
      return;
    }
    editor.chain().focus().setImage({ src: imageUrl, alt: "" }).run();
    setImageUrl("");
    setShowImageInput(false);
  }, [editor, imageUrl]);

  return (
    <div className="border-b border-slate-200 bg-slate-50">
      {/* Main toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2">
        {/* History */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-3.5 w-3.5" />
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        {/* Headings */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            active={editor.isActive("paragraph")}
            title="Paragraph"
          >
            <Type className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        {/* Text formatting */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            active={editor.isActive("highlight")}
            title="Highlight"
          >
            <Highlighter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
            title="Inline code"
          >
            <Code className="h-3.5 w-3.5" />
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        {/* Alignment */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            active={editor.isActive({ textAlign: "left" })}
            title="Align left"
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            active={editor.isActive({ textAlign: "center" })}
            title="Align center"
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            active={editor.isActive({ textAlign: "right" })}
            title="Align right"
          >
            <AlignRight className="h-3.5 w-3.5" />
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        {/* Lists & blocks */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet list"
          >
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered list"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Blockquote"
          >
            <Quote className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Code block"
          >
            <Code2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal rule"
          >
            <Minus className="h-3.5 w-3.5" />
          </ToolbarButton>
        </ToolbarGroup>

        <Divider />

        {/* Link & Image */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => {
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run();
              } else {
                setShowImageInput(false);
                setShowLinkInput((s) => !s);
              }
            }}
            active={editor.isActive("link")}
            title={editor.isActive("link") ? "Remove link" : "Add link"}
          >
            {editor.isActive("link") ? (
              <Link2Off className="h-3.5 w-3.5" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              setShowLinkInput(false);
              setShowImageInput((s) => !s);
            }}
            title="Insert image"
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
        </ToolbarGroup>
      </div>

      {/* Link input popover */}
      {showLinkInput && (
        <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2">
          <Link2 className="h-4 w-4 flex-shrink-0 text-slate-400" />
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setLink(); } if (e.key === "Escape") setShowLinkInput(false); }}
            placeholder="https://example.com"
            autoFocus
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
          />
          <button
            type="button"
            onClick={setLink}
            className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="text-xs text-slate-400 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Image URL input */}
      {showImageInput && (
        <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2">
          <ImageIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertImage(); } if (e.key === "Escape") setShowImageInput(false); }}
            placeholder="https://example.com/image.jpg"
            autoFocus
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
          />
          <button
            type="button"
            onClick={insertImage}
            className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => setShowImageInput(false)}
            className="text-xs text-slate-400 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export function RichTextEditor({
  content = "",
  onChange,
  placeholder = "Start writing your article…",
  className,
  minHeight = "400px",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // replaced by CodeBlockLowlight
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-blue-600 underline underline-offset-2 hover:text-blue-700",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto my-4",
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: "rounded-lg bg-slate-900 text-slate-100 p-4 text-sm font-mono overflow-x-auto my-4",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-slate-400 before:float-left before:h-0 before:pointer-events-none",
      }),
      CharacterCount,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-slate max-w-none focus:outline-none",
          "prose-headings:font-bold prose-headings:text-slate-900",
          "prose-p:text-slate-800 prose-p:leading-relaxed",
          "prose-a:text-blue-600",
          "prose-code:bg-slate-100 prose-code:text-slate-800 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:before:content-none prose-code:after:content-none",
          "prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-slate-700",
          "prose-ul:list-disc prose-ol:list-decimal",
          "prose-img:rounded-lg prose-img:shadow-sm",
          "prose-hr:border-slate-300",
          "p-5"
        ),
        style: `min-height: ${minHeight}`,
      },
    },
    immediatelyRender: false,
  });

  if (!editor) return null;

  const charCount = editor.storage.characterCount.characters();
  const wordCount = editor.storage.characterCount.words();

  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200 bg-white", className)}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-400">
        <span>
          {wordCount} word{wordCount !== 1 ? "s" : ""} · {charCount} character{charCount !== 1 ? "s" : ""}
        </span>
        <span className="text-slate-300">
          Rich text · HTML output
        </span>
      </div>
    </div>
  );
}
