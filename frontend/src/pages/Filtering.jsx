import React, { useState } from "react";

const sampleNotes = [
  { id: 1, title: "React Basics", tags: ["react", "frontend"] },
  { id: 2, title: "SQL Injection", tags: ["security", "backend"] },
  { id: 3, title: "CSS Flexbox", tags: ["css", "frontend"] },
  { id: 4, title: "JWT Authentication", tags: ["security", "auth"] },
];

function FilterNotes() {
  const [selectedTag, setSelectedTag] = useState("all");

  const allTags = [
    "all",
    ...new Set(sampleNotes.flatMap((note) => note.tags)),
  ];

  const filteredNotes =
    selectedTag === "all"
      ? sampleNotes
      : sampleNotes.filter((note) =>
          note.tags.includes(selectedTag)
        );

  return (
    <div style={styles.container}>
      <h2>Filter Notes by Tag</h2>

      <div style={styles.filterContainer}>
        <label>Select Tag: </label>
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          style={styles.select}
        >
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.notesContainer}>
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <div key={note.id} style={styles.noteCard}>
              <h4>{note.title}</h4>
              <div style={styles.tagContainer}>
                {note.tags.map((tag) => (
                  <span key={tag} style={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p>No notes found for this tag.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "600px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },
  filterContainer: {
    marginBottom: "1.5rem",
  },
  select: {
    padding: "0.5rem",
    marginLeft: "0.5rem",
  },
  notesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  noteCard: {
    border: "1px solid #ddd",
    padding: "1rem",
    borderRadius: "6px",
    backgroundColor: "#8e2121",
  },
  tagContainer: {
    marginTop: "0.5rem",
  },
  tag: {
    backgroundColor: "#007bff",
    color: "white",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    marginRight: "0.5rem",
    fontSize: "0.8rem",
  },
};

export default FilterNotes;
