import React, { useState } from 'react';
import NoteEditor from '../components/NoteEditor';

const NotesPage = () => {
  // Mock Database
  const [notes, setNotes] = useState([
    {
      _id: '1',
      title: 'Graph Coverage Criteria',
      content: '<p>Notes on <strong>node coverage</strong> and edge coverage...</p>',
      tags: ['testing', 'algorithms'],
      summary: ''
    },
    {
      _id: '2',
      title: 'MERN Stack Architecture',
      content: '<p>Understanding the three-tier architecture.</p>',
      tags: ['web-dev'],
      summary: ''
    }
  ]);

  const [activeNoteId, setActiveNoteId] = useState('1');
  const activeNote = notes.find(note => note._id === activeNoteId);

  const handleUpdateNote = (field, value) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note._id === activeNoteId ? { ...note, [field]: value } : note
      )
    );
  };

  const handleAddNote = () => {
    const newNote = {
      _id: Date.now().toString(),
      title: '',
      content: '',
      tags: [],
      summary: ''
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote._id);
  };

  const handleDeleteNote = (noteId) => {
    const remaining = notes.filter(note => note._id !== noteId);
    setNotes(remaining);

    if (activeNoteId === noteId) {
      if (remaining.length > 0) {
        const deletedIndex = notes.findIndex(n => n._id === noteId);
        const nextIndex = Math.max(0, deletedIndex - 1);
        setActiveNoteId(remaining[nextIndex]?._id ?? null);
      } else {
        setActiveNoteId(null);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">My Notes</h2>
          <button 
            onClick={handleAddNote}
            className="text-gray-400 hover:text-blue-600 transition-colors p-1"
            title="Create New Note"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {notes.map(note => (
            <div
              key={note._id}
              onClick={() => setActiveNoteId(note._id)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                activeNoteId === note._id 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <h3 className="truncate flex-1 mr-2">
                {note.title || 'Untitled Note'}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // don't select note when deleting
                  handleDeleteNote(note._id);
                }}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                title="Delete note"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeNote ? (
          <NoteEditor 
            note={activeNote} 
            onUpdate={handleUpdateNote} 
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No note selected</p>
            <button onClick={handleAddNote} className="mt-3 text-sm text-blue-500 hover:underline">
              + Create a note
            </button>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default NotesPage;