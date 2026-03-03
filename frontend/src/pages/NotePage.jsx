import React, { useState, useRef, useEffect } from 'react';
import NoteEditor from '../components/NoteEditor';

const UNFILED_ID = '__unfiled__';

const NotesPage = () => {
  // Folder variables 
  const [folders, setFolders] = useState([
    { _id: UNFILED_ID, name: 'Unfiled' },
  ]);
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const newFolderInputRef = useRef(null);

  //note tags
  const [tagInput, setTagInput] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);

  // Mock database
  const [notes, setNotes] = useState([
    {
      _id: '1',
      folderId: UNFILED_ID,
      title: 'Graph Coverage Criteria',
      content: '<p>Notes on <strong>node coverage</strong> and edge coverage...</p>',
      tags: ['testing', 'algorithms'],
      summary: '',
    },
    {
      _id: '2',
      folderId: UNFILED_ID,
      title: 'MERN Stack Architecture',
      content: '<p>Understanding the three-tier architecture.</p>',
      tags: ['web-dev'],
      summary: '',
    },
  ]);

  const [activeNoteId, setActiveNoteId] = useState('1');
  const [moveMenuNoteId, setMoveMenuNoteId] = useState(null);
  const activeNote = notes.find(n => n._id === activeNoteId);

  // Note operations
  const handleUpdateNote = (field, value) => {
    setNotes(prev =>
      prev.map(n => (n._id === activeNoteId ? { ...n, [field]: value } : n))
    );
  };

  const handleAddNote = (folderId = UNFILED_ID) => {
    const newNote = {
      _id: Date.now().toString(),
      folderId,
      title: '',
      content: '',
      tags: [],
      summary: '',
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote._id);
    setCollapsedFolders(prev => ({ ...prev, [folderId]: false }));
  };

  const handleDeleteNote = (noteId) => {
    const remaining = notes.filter(n => n._id !== noteId);
    setNotes(remaining);
    if (activeNoteId === noteId) {
      const idx = notes.findIndex(n => n._id === noteId);
      setActiveNoteId(remaining[Math.max(0, idx - 1)]?._id ?? null);
    }
  };

  const handleMoveNote = (noteId, targetFolderId) => {
    setNotes(prev =>
      prev.map(n => (n._id === noteId ? { ...n, folderId: targetFolderId } : n))
    );
    setMoveMenuNoteId(null);
  };


  // Folder operations
  const toggleFolder = (folderId) =>
    setCollapsedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) { setCreatingFolder(false); setNewFolderName(''); return; }
    setFolders(prev => [...prev, { _id: Date.now().toString(), name }]);
    setCreatingFolder(false);
    setNewFolderName('');
  };

  const handleDeleteFolder = (folderId) => {
    if (folderId === UNFILED_ID) return;
    setNotes(prev =>
      prev.map(n => (n.folderId === folderId ? { ...n, folderId: UNFILED_ID } : n))
    );
    setFolders(prev => prev.filter(f => f._id !== folderId));
  };

  useEffect(() => {
    if (creatingFolder) newFolderInputRef.current?.focus();
  }, [creatingFolder]);

  useEffect(() => {
    if (!moveMenuNoteId) return;
    const handler = () => setMoveMenuNoteId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [moveMenuNoteId]);

  const NoteRow = ({ note }) => (
    <div
      onClick={() => setActiveNoteId(note._id)}
      className={`group flex items-center justify-between pl-6 pr-2 py-2 rounded-lg cursor-pointer transition-all ${
        activeNoteId === note._id
          ? 'bg-blue-50 text-blue-700 font-medium'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span className="truncate flex-1 text-sm mr-1">
        {note.title || 'Untitled Note'}
      </span>

      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMoveMenuNoteId(prev => (prev === note._id ? null : note._id));
            }}
            className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
            title="Move to folder"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </button>
          {moveMenuNoteId === note._id && (
            <div
              onClick={e => e.stopPropagation()}
              className="absolute left-0 top-7 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-max"
            >
              <p className="px-3 py-1 text-xs text-gray-400 font-semibold uppercase tracking-wide">Move to</p>
              {folders.map(f => (
                <button
                  key={f._id}
                  onClick={() => handleMoveNote(note._id, f._id)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors ${
                    note.folderId === f._id ? 'text-blue-600 font-medium' : 'text-gray-700'
                  }`}
                >
                  {note.folderId === f._id ? '✓ ' : ''}{f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete note */}
        <button
          onClick={(e) => { e.stopPropagation(); handleDeleteNote(note._id); }}
          className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          title="Delete note"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );

   const allTags = [...new Set(notes.flatMap(n => n.tags))];
  const filteredNotes = selectedTag
  ? notes.filter(n => n.tags.includes(selectedTag))
  : notes;

  // Render page
  return (
    <div className="flex h-screen bg-gray-100 font-sans">

      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">

        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">My Notes</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCreatingFolder(true)}
              className="text-gray-400 hover:text-blue-600 transition-colors p-1"
              title="New Folder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h4l2 2h7a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2z" />
              </svg>
            </button>
            <button
              onClick={() => handleAddNote(UNFILED_ID)}
              className="text-gray-400 hover:text-blue-600 transition-colors p-1"
              title="New Note"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* New folder input */}
        {creatingFolder && (
          <div className="px-3 py-2 border-b border-gray-100">
            <input
              ref={newFolderInputRef}
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName(''); }
              }}
              onBlur={handleCreateFolder}
              placeholder="Folder name..."
              className="w-full text-sm px-2 py-1.5 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 bg-white"
            />
          </div>
        )}

        {/* Folder list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          
                {allTags.length > 0 && (
  <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap gap-1">
    {allTags.map(tag => (
      <button
        key={tag}
        onClick={() => setSelectedTag(prev => prev === tag ? null : tag)}
        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
          selectedTag === tag
            ? "bg-blue-500 text-white border-blue-500"
            : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"
        }`}
      >
        #{tag}
      </button>
    ))}
  </div>
)}
          {folders.map(folder => {
            const folderNotes = filteredNotes.filter(n => n.folderId === folder._id);
            const isCollapsed = !!collapsedFolders[folder._id];

            return (
              <div key={folder._id}>
                <div className="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 select-none">
                  <button
                    onClick={() => toggleFolder(folder._id)}
                    className="flex items-center gap-1.5 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-3.5 w-3.5 text-gray-400 flex-shrink-0 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 truncate">{folder.name}</span>
                    <span className="text-xs text-gray-400 ml-1 flex-shrink-0">{folderNotes.length}</span>
                  </button>

                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleAddNote(folder._id)}
                      className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                      title="New note in this folder"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    {folder._id !== UNFILED_ID && (
                      <button
                        onClick={() => handleDeleteFolder(folder._id)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Delete folder (notes move to Unfiled)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>


                {/* Notes inside folder */}
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {folderNotes.length === 0 ? (
                      <p className="pl-8 py-1 text-xs text-gray-400 italic">No notes</p>
                    ) : (
                      folderNotes.map(note => <NoteRow key={note._id} note={note} />)
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        {activeNote ? (
          <NoteEditor note={activeNote} onUpdate={handleUpdateNote} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No note selected</p>
            <button onClick={() => handleAddNote()} className="mt-3 text-sm text-blue-500 hover:underline">
              + Create a note
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default NotesPage;
