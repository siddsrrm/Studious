import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Blockquote from '@tiptap/extension-blockquote'
import HardBreak from '@tiptap/extension-hard-break'
import { EditorContent, useEditor } from '@tiptap/react'
import History from '@tiptap/extension-history'
import React, { useEffect } from 'react'

// Toolbar button component
const ToolbarButton = ({ onClick, isActive, children, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-gray-100 text-white-800 hover:bg-gray-200 border border-gray-300'
    }`}
  >
    {children}
  </button>
)

const Divider = () => <div className="w-px h-6 bg-gray-400 mx-1" />

// Toolbar component
const MenuBar = ({ editor }) => {
  if (!editor) return null

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-100 border-b border-gray-300 sticky top-0 z-20">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <span>B</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <span>I</span>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <span className="line-through">S</span>
      </ToolbarButton>


      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        H1
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        isActive={editor.isActive('paragraph')}
        title="Paragraph"
      >
        P
      </ToolbarButton>


      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        Bullet
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Ordered List"
      >
        Numbered
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        " "
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo"
      >
        ↶ Undo
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo"
      >
        ↷ Redo
      </ToolbarButton>
    </div>
  )
}

// Main NoteEditor component
export default function NoteEditor({ note, onUpdate }) {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Strike,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      HardBreak,
      History, 
    ],
    content: note?.content || '<p>Start typing...</p>',

    editorProps: {
      attributes: {
        class: 'focus:outline-none', 
      },
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate('content', editor.getHTML())
      }
    },
  })

  // Sync editor when note changes
  useEffect(() => {
    if (editor && note && editor.getHTML() !== note.content) {
      editor.commands.setContent(note.content || '<p></p>')
    }
  }, [note?._id, editor])

  if (!note) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        <p>Select or create a note to get started</p>
      </div>
    )
  }

  return (
    <div className="text-left max-w-5xl mx-auto my-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Title Input */}
      <input
        type="text"
        className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none mb-6 bg-transparent"
        placeholder="Note Title..."
        value={note.title || ''}
        onChange={(e) => onUpdate && onUpdate('title', e.target.value)}
      />

      {/* Toolbar */}
      <MenuBar editor={editor} />

      {/* Editor */}
      <div className="prose prose-lg max-w-none p-6 min-h-96 bg-white rounded-b-lg border-l border-r border-b border-gray-200 text-gray-900">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
