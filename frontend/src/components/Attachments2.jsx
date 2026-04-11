import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

const API_URL = "http://localhost:5000/api"; // adjust if needed

export default function Attachments({ taskId, token }) {
  const [attachments, setAttachments] = useState([]);
  const [url, setUrl] = useState("");

  // -------------------------
  // Fetch attachments
  // -------------------------
  const fetchAttachments = async () => {};

  useEffect();

  // -------------------------
  // Add link attachment
  // -------------------------
  const handleAddLink = async (e) => {};

  // -------------------------
  // File upload handler (mocked upload step)
  // -------------------------
  const uploadFile = async (file) => {};

  const onDrop = useCallback(
    async (acceptedFiles) => {
      for (const file of acceptedFiles) {
        const uploaded = await uploadFile(file);

        await fetch(`${API_URL}/attachments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            taskId,
            type: "file",
            ...uploaded,
          }),
        });
      }

      fetchAttachments();
    },
    [taskId],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // -------------------------
  // Delete attachment
  // -------------------------
  const deleteAttachment = async (id) => {};

  // -------------------------
  // UI
  // -------------------------
  return (
    <div style={{ padding: 20 }}>
      <h2>Attachments</h2>

      {/* LINK FORM */}
      <form onSubmit={handleAddLink}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste link..."
        />
        <button type="submit">Add Link</button>
      </form>

      {/* DROPZONE */}
      <div
        {...getRootProps()}
        style={{
          marginTop: 20,
          padding: 20,
          border: "2px dashed gray",
          cursor: "pointer",
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop files here...</p>
        ) : (
          <p>Drag & drop files here, or click to upload</p>
        )}
      </div>

      {/* LIST */}
      <ul style={{ marginTop: 20 }}>
        {attachments.map((att) => (
          <li key={att._id}>
            {att.type === "link" ? (
              <a href={att.url} target="_blank">
                {att.url}
              </a>
            ) : (
              <a href={att.fileUrl} target="_blank">
                📎 {att.filename}
              </a>
            )}

            <button onClick={() => deleteAttachment(att._id)}>delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
