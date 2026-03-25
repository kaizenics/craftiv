"use client";

import { useEffect, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Sparkles,
  Undo2,
  Underline as UnderlineIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type WysiwygEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onGenerateWithAI?: () => void;
  isGeneratingWithAI?: boolean;
  disableGenerateWithAI?: boolean;
};

const isEffectivelyEmpty = (html: string) => {
  const normalized = (html || "").replaceAll(/\s/g, "").toLowerCase();
  return (
    !normalized ||
    normalized === "<p></p>" ||
    normalized === "<p><br></p>" ||
    normalized === "<br>"
  );
};

export function WysiwygEditor({
  value,
  onChange,
  placeholder = "Write here...",
  className,
  onGenerateWithAI,
  isGeneratingWithAI = false,
  disableGenerateWithAI = false,
}: WysiwygEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        autolink: true,
        openOnClick: false,
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "text-sky-600 underline underline-offset-2",
        },
      }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] rounded-b-lg border-x border-b border-border bg-background px-3 py-2.5 text-sm leading-6 outline-none focus:outline-none focus-visible:outline-none [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1 [&_a]:text-sky-600 [&_a]:underline [&_a]:underline-offset-2",
      },
    },
    onUpdate: ({ editor: current }) => {
      const html = current.getHTML();
      onChange(isEffectivelyEmpty(html) ? "" : html);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || "<p></p>";
    if (current !== incoming) editor.commands.setContent(incoming, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Enter URL", previousUrl);
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const href = /^https?:\/\//i.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  const toolbarButton = (
    isActive: boolean,
    onClick: () => void,
    icon: ReactNode,
    label: string,
    disabled = false
  ) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0",
        disabled && "cursor-not-allowed opacity-50",
        isActive
          ? "border-sky-300 bg-sky-100 text-sky-700"
          : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      )}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-between gap-2 rounded-t-lg border border-border bg-muted/10 p-1.5">
        <div className="flex flex-wrap items-center gap-1">
          {toolbarButton(
            false,
            () => editor.chain().focus().undo().run(),
            <Undo2 className="h-4 w-4" />,
            "Undo",
            !editor.can().undo()
          )}
          {toolbarButton(
            false,
            () => editor.chain().focus().redo().run(),
            <Redo2 className="h-4 w-4" />,
            "Redo",
            !editor.can().redo()
          )}
          <div className="mx-1 h-5 w-px bg-border" />
          {toolbarButton(
            editor.isActive("bold"),
            () => editor.chain().focus().toggleBold().run(),
            <Bold className="h-4 w-4" />,
            "Bold"
          )}
          {toolbarButton(
            editor.isActive("italic"),
            () => editor.chain().focus().toggleItalic().run(),
            <Italic className="h-4 w-4" />,
            "Italic"
          )}
          {toolbarButton(
            editor.isActive("underline"),
            () => editor.chain().focus().toggleUnderline().run(),
            <UnderlineIcon className="h-4 w-4" />,
            "Underline"
          )}
          {toolbarButton(
            editor.isActive("link"),
            setLink,
            <Link2 className="h-4 w-4" />,
            "Insert link"
          )}
          <div className="mx-1 h-5 w-px bg-border" />
          {toolbarButton(
            editor.isActive("bulletList"),
            () => editor.chain().focus().toggleBulletList().run(),
            <List className="h-4 w-4" />,
            "Bullet list"
          )}
          {toolbarButton(
            editor.isActive("orderedList"),
            () => editor.chain().focus().toggleOrderedList().run(),
            <ListOrdered className="h-4 w-4" />,
            "Ordered list"
          )}
        </div>

        {onGenerateWithAI && (
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 rounded-md px-3 text-xs"
            onClick={onGenerateWithAI}
            disabled={isGeneratingWithAI || disableGenerateWithAI}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isGeneratingWithAI ? "Generating..." : "Generate with AI"}
          </Button>
        )}
      </div>

      <EditorContent editor={editor} />

      {isEffectivelyEmpty(value) && (
        <div className="pointer-events-none absolute left-4 top-12 text-sm text-muted-foreground">
          {placeholder}
        </div>
      )}
    </div>
  );
}

