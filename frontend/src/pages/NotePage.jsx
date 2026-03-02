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

  return (
    // Changed main background to a subtle gray (bg-gray-100)
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* --- SIDEBAR --- */}
      {/* Kept sidebar white to contrast with the gray workspace */}
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
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                activeNoteId === note._id 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <h3 className="truncate">
                {note.title || 'Untitled Note'}
              </h3>
            </div>
          ))}
        </div>
      </div>

      {/* --- MAIN WORKSPACE --- */}
      {/* Let the workspace handle scrolling, allowing the NoteEditor card to sit comfortably */}
      <div className="flex-1 overflow-y-auto">
        {/* We pass the note and the update function down to the editor */}
        <NoteEditor 
          note={activeNote} 
          onUpdate={handleUpdateNote} 
        />
      </div>
      
    </div>
  );
};

export default NotesPage;