import React, { useState, useRef, useEffect } from 'react';
import NoteEditor from '../components/NoteEditor';

const UNFILED_ID = '__unfiled__';

const NotesPage = ({ studyPlanId }) => {
  //token
  const token = localStorage.getItem("token");

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
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);

  const [notes, setNotes] = useState([]);

  const [activeNoteId, setActiveNoteId] = useState(null);
  const [moveMenuNoteId, setMoveMenuNoteId] = useState(null);
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState(null);
  const activeNote = notes.find(n => n._id === activeNoteId);
  const saveTimerRef = useRef(null);

  // Fetch notes for this study plan
  useEffect(() => {
    if (!token || !studyPlanId) return;
    (async () => {
      try {
        // Fetch notes and folders in parallel
        const [notesRes, foldersRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/notes?studyPlanId=${studyPlanId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${import.meta.env.VITE_API_URL}/folders?studyPlanId=${studyPlanId}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (notesRes.ok) {
          const notesData = await notesRes.json();
          const withFolder = notesData.map(n => ({ ...n, folderId: n.folderId || UNFILED_ID }));
          setNotes(withFolder);
          if (withFolder.length > 0) setActiveNoteId(withFolder[0]._id);
        }

        if (foldersRes.ok) {
          const foldersData = await foldersRes.json();
          setFolders([{ _id: UNFILED_ID, name: 'Unfiled' }, ...foldersData]);
        }
      } catch (err) {
        // ignore network errors
      }
    })();
  }, [studyPlanId]);

  // Note operations
  const handleUpdateNote = (field, value) => {
    setNotes(prev =>
      prev.map(n => (n._id === activeNoteId ? { ...n, [field]: value } : n))
    );

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!token || !activeNoteId) return;
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/notes/${activeNoteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ [field]: value }),
        });
      } catch (err) {
      }
    }, 500);
  };

  const handleAddNote = async (folderId = UNFILED_ID) => {
    if (!token || !studyPlanId) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studyPlanID: studyPlanId, title: '', content: '', tags: [], folderId }),
      });

      if (res.ok) {
        const saved = await res.json();
        const newNote = { ...saved, folderId };
        setNotes(prev => [newNote, ...prev]);
        setActiveNoteId(saved._id);
        setCollapsedFolders(prev => ({ ...prev, [folderId]: false }));
      }
    } catch (err) {
    }
  };

  const handleDeleteNote = async (noteId) => {
    const remaining = notes.filter(n => n._id !== noteId);
    setNotes(remaining);
    if (activeNoteId === noteId) {
      const idx = notes.findIndex(n => n._id === noteId);
      setActiveNoteId(remaining[Math.max(0, idx - 1)]?._id ?? null);
    }

    // Delete from backend
    if (!token) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/notes/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      // ignore
    }
  };

  const handleMoveNote = (noteId, targetFolderId) => {
    setNotes(prev =>
      prev.map(n => (n._id === noteId ? { ...n, folderId: targetFolderId } : n))
    );
    setMoveMenuNoteId(null);

    // Save folder change to backend
    if (!token) return;
    (async () => {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/notes/${noteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ folderId: targetFolderId }),
        });
      } catch (err) {
        // ignore
      }
    })();
  };


  // Folder operations
  const toggleFolder = (folderId) =>
    setCollapsedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) { setCreatingFolder(false); setNewFolderName(''); return; }

    if (token && studyPlanId) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/folders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ studyPlanID: studyPlanId, name }),
        });
        if (res.ok) {
          const saved = await res.json();
          setFolders(prev => [...prev, saved]);
          setCreatingFolder(false);
          setNewFolderName('');
          return;
        }
      } catch (err) {
      }
    }

    setFolders(prev => [...prev, { _id: Date.now().toString(), name }]);
    setCreatingFolder(false);
    setNewFolderName('');
  };

  const handleDeleteFolder = async (folderId) => {
    if (folderId === UNFILED_ID) return;

    // Move notes in this folder to Unfiled 
    const notesInFolder = notes.filter(n => n.folderId === folderId);
    setNotes(prev =>
      prev.map(n => (n.folderId === folderId ? { ...n, folderId: UNFILED_ID } : n))
    );
    setFolders(prev => prev.filter(f => f._id !== folderId));

    if (!token) return;

    // Update each note's folderId on the server
    for (const note of notesInFolder) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/notes/${note._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ folderId: UNFILED_ID }),
        });
      } catch (err) { }
    }

    // Delete folder from backend
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/folders/${folderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
    }
  };

//tag operations
const searchController = useRef(null);

const handleSearch = async (term) => {
  setSearchTerm(term);

  if (searchController.current) searchController.current.abort();

  if (!term.trim()) {
    setSearchResults(null);
    return;
  }

  searchController.current = new AbortController();

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/notes/search?tag=${term}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: searchController.current.signal
    });
    const data = await res.json();
    setSearchResults(Array.isArray(data) ? data : []);
  } catch (err) {
    if (err.name === "AbortError") return; 
  }
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
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDeleteNoteId(note._id); }}
            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Delete note"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          {confirmDeleteNoteId === note._id && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-8 z-50 w-52 bg-white border border-gray-200 rounded-lg shadow-lg p-3"
            >
              <p className="text-sm text-gray-700 mb-2">Delete this note?</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDeleteNoteId(null)}
                  className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteNoteId(null);
                    handleDeleteNote(note._id);
                  }}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

   const allTags = [...new Set(notes.flatMap(n => n.tags))];
  const filteredNotes = searchTerm.trim()
  ? notes.filter(n => n.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
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
    <div className="px-3 py-2 border-b border-gray-100">
  <input
    type="text"
    value={searchTerm}
    onChange={e => handleSearch(e.target.value)}
    placeholder="Search by tag..."
    className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-blue-300 text-gray-700"
  />
</div>
)}
          {folders.map(folder => {
            const folderNotes = (searchResults ?? notes).filter(n => n.folderId === folder._id);
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
