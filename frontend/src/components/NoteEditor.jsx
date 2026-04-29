import Document from '@tiptap/extension-document'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import HardBreak from '@tiptap/extension-hard-break'
import Paragraph from '@tiptap/extension-paragraph'
import { EditorContent, useEditor } from '@tiptap/react'
import History from '@tiptap/extension-history'
import { Markdown } from '@tiptap/markdown';
import {Color} from '@tiptap/extension-color'
import {TextStyle} from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import { Extension } from '@tiptap/core' 
import React, { useEffect, useState, useRef } from 'react'

const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}


// Fontsize extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) return {}
              return { style: `font-size: ${attributes.fontSize}` }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).run()
      },
    }
  },
})

// Toolbar button component
const ToolbarButton = ({ onClick, children, title }) => (
  <button
    type="button" 
    onClick={onClick}
    title={title}
    className="px-3 py-2 bg-gray-500 text-white-800 hover:bg-blue-600 border border-gray-300 rounded text-sm font-medium transition-colors shadow-sm"
  >
    {children}
  </button>
)


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

      {/* Font size extension*/}
      <select
        onChange={(event) => editor.chain().focus().setFontSize(event.target.value).run()}
        value={editor.getAttributes('textStyle').fontSize || '16px'} 
        className="px-2 py-1.5 bg-gray-500 text-white border border-gray-300 rounded text-sm font-medium hover:bg-blue-600 cursor-pointer outline-none shadow-sm"
        title="Font Size"
      >
        <option value="12px">12px</option>
        <option value="14px">14px</option>
        <option value="16px">16px (Default)</option>
        <option value="18px">18px</option>
        <option value="20px">20px</option>
        <option value="24px">24px</option>
        <option value="30px">30px</option>
        <option value="36px">36px</option>
      </select>

      <div className="relative flex items-center">
        <label
          title="Text Color"
          className="flex flex-col items-center justify-center w-10 h-9 rounded text-sm font-bold transition-colors bg-gray-500 text-white-800 hover:bg-blue-800 border border-gray-300 cursor-pointer overflow-hidden"
        >
          <span className="leading-none mt-1 text-white">A</span>
          
          <div 
            className="h-1 w-4 mt-0.5 rounded-sm" 
            style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }}
          />
          
          {/* Color extension*/}
          <input
            type="color"
            onInput={(event) => editor.chain().focus().setColor(event.target.value).run()}
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>

       <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title="Highlight"
       >
        Highlight
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

//create tageditor component
const TagEditor = ({ tags, onUpdate }) => {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    if (!tagInput.trim() || tags.includes(tagInput.trim())) return;
    onUpdate("tags", [...tags, tagInput.trim()]);
    setTagInput("");
  };

  const handleRemoveTag = (tag) => {
    onUpdate("tags", tags.filter(t => t !== tag));
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {tags.map(tag => (
        <span key={tag} className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full">
          #{tag}
          <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">×</button>
        </span>
      ))}
      <input
        type="text"
        value={tagInput}
        onChange={e => setTagInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); }}}
        placeholder="Add tag..."
        className="text-xs px-2 py-1 border border-gray-200 rounded-full outline-none focus:border-blue-300 w-24 text-gray-800"
      />
    </div>
  );
};

const VoiceInputButton = ({ editor }) => {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')
  const [interim, setInterim] = useState('')
  const [finalText, setFinalText] = useState('')
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (!finalText || !editor) return
    editor.chain().focus().insertContent(finalText).run()
    setFinalText('')
  }, [finalText, editor])

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
    }
  }, [])

  const toggle = () => {
    setError('')
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) {
      setError('Voice input isn\'t supported in this browser.')
      return
    }

    if (isListening) {
      // Stop the current recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator?.language || 'en-US'

    recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result?.[0]?.transcript || ''
        if (result.isFinal) finalTranscript += text
        else interimTranscript += text
      }

      setInterim(interimTranscript)
      if (finalTranscript.trim()) {
        // Add a trailing space to feel natural while dictating.
        setFinalText(prev => prev + finalTranscript + ' ')
      }
    }

    recognition.onerror = (e) => {
      // Common: not-allowed, service-not-allowed, no-speech
      const msg = e?.error === 'not-allowed'
        ? 'Microphone permission denied.'
        : e?.error === 'no-speech'
          ? 'No speech detected.'
          : 'Voice input error.'
      setError(msg)
      setIsListening(false)
    }

    recognition.onend = () => {
      setInterim('')
      setIsListening(false)
      recognitionRef.current = null
    }

    try {
      recognition.start()
      setIsListening(true)
    } catch (err) {
      // start() can throw if called twice quickly
      setError('Could not start voice input.')
      setIsListening(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        className={`px-3 py-2 rounded text-sm font-medium border transition-colors shadow-sm ${
          isListening
            ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
            : 'bg-gray-500 text-white border-gray-300 hover:bg-blue-600'
        }`}
        title={isListening ? 'Stop voice input' : 'Start voice input'}
        aria-pressed={isListening}
      >
        {isListening ? '⏹ Stop' : '🎙 Voice'}
      </button>

      {isListening && (
        <span className="text-xs text-gray-600" aria-live="polite">
          Listening… {interim ? `“${interim}”` : ''}
        </span>
      )}

      {!isListening && error && (
        <span className="text-xs text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

// Main NoteEditor component
export default function NoteEditor({ note, onUpdate }) {
  const editor = useEditor({
    extensions: [
      Document,
      Markdown,
      Paragraph,
      Text,
      Color,
      TextStyle,
      FontSize, 
      Bold,
      Italic,
      Strike,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      BulletList,
      OrderedList,
      ListItem,
      HardBreak,
      History, 
      Highlight,
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
      {/* Handles notes title */}
      <input
        type="text"
        className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none mb-6 bg-transparent"
        placeholder="Note Title..."
        value={note.title || ''}
        onChange={(e) => onUpdate && onUpdate('title', e.target.value)}
      />

      <TagEditor key={note._id} tags={note.tags || []} onUpdate={onUpdate} />

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-xs text-gray-500">
          Tip: Use voice input to dictate, then edit normally.
        </div>
        <VoiceInputButton editor={editor} />
      </div>

      <MenuBar editor={editor} />

      <div className="prose max-w-none p-6 min-h-96 bg-white rounded-b-lg border-l border-r border-b border-gray-200 text-gray-900">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}