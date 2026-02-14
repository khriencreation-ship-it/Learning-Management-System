"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading1, Heading2 } from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50/50">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Bold"
            >
                <Bold size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Italic"
            >
                <Italic size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('underline') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Underline"
            >
                <UnderlineIcon size={18} />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Heading 1"
            >
                <Heading1 size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Heading 2"
            >
                <Heading2 size={18} />
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Bullet List"
            >
                <List size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Ordered List"
            >
                <ListOrdered size={18} />
            </button>
        </div>
    );
};

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
        ],
        immediatelyRender: false,
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm focus:outline-none max-w-none p-4 min-h-[150px] font-medium text-gray-700',
            },
        },
    });

    return (
        <div className="w-full rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all bg-white">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
