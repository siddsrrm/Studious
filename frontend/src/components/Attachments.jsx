import React, { useState, useEffect } from "react";
import "../css/Attachments.css";

const API = import.meta.env.VITE_API_URL;

const Attachments = ({ taskId }) => {
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [links, setLinks] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    setLoading(true);
    async function fetchAttachments() {
      try {
        const res = await fetch(`${API}/attachments?taskId=${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          console.error(data.message || "Failed to load attachments.");
          return;
        }
        const loadedFiles = [];
        const loadedLinks = [];
        for (const attachment of data) {
          if (attachment.type === "file") loadedFiles.push(attachment);
          if (attachment.type === "link") loadedLinks.push(attachment);
        }
        setFiles(loadedFiles);
        setLinks(loadedLinks);
      } catch {
        console.error("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchAttachments();
  }, [taskId, token]);

  const handleAddAttachment = async ({
    type,
    url,
    filename,
    fileUrl,
    size,
    mimeType,
  }) => {
    const validTypes = ["link", "file"];

    if (!validTypes.includes(type)) return;

    try {
      const res = await fetch(`${API}/attachments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: taskId,
          type,
          url,
          filename,
          fileUrl,
          size,
          mimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(data.message || "Failed to create attachment.");
        return;
      }
      if (type === "file") setFiles((prev) => [...prev, data]);
      if (type === "link") setLinks((prev) => [...prev, data]);
    } catch {
      console.error("Network error. Please try again.");
    }
  };

  const handleUpdateAttachments = async (
    id,
    { type, url, filename, fileUrl, size, mimeType },
  ) => {
    const validTypes = ["link", "file"];

    if (!validTypes.includes(type)) return;

    try {
      const res = await fetch(`${API}/attachments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId: taskId,
          type,
          url,
          filename,
          fileUrl,
          size,
          mimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(data.message || "Failed to update attachment.");
        return;
      }
      if (type === "file")
        setFiles((prev) => prev.map((f) => (f._id === id ? data : f)));
      if (type === "link")
        setLinks((prev) => prev.map((l) => (l._id === id ? data : l)));
    } catch {
      console.error("Network error. Please try again.");
    }
  };

  const handleDeleteAttachment = async (id, type) => {
    try {
      const res = await fetch(`${API}/attachments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error("Failed to delete attachment.");
        return;
      }
      if (type === "file") setFiles((prev) => prev.filter((f) => f._id !== id));
      if (type === "link") setLinks((prev) => prev.filter((l) => l._id !== id));
    } catch {
      console.error("Network error. Please try again.");
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data.message || "Upload failed");
        return;
      }

      return data;
    } catch {
      console.error("Upload error");
    }
  };

  const normalizeUrl = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.hostname + parsed.pathname;
    } catch {
      return null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setError("Please enter a URL...");
      return;
    }

    const normalized = normalizeUrl(trimmed);
    console.log(normalized);

    if (!normalized) {
      setError("Please enter a valid URL...");
      return;
    }

    const alreadyExists = links.some(
      (link) => normalizeUrl(link.url) === normalized,
    );

    if (alreadyExists) {
      setError("Link already exists!");
      return;
    }

    handleAddAttachment({ type: "link", url: trimmed });
    setInputValue("");
    setError("");
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Paste a link or type text..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError("");
            }}
            style={{
              border: error ? "2px solid red" : "1px solid #ccc",
              outline: "none",
            }}
          />
          <button type="submit">Add</button>
          {error && <p style={{ color: "red", marginTop: "5px" }}>{error}</p>}
        </form>
        <ul>
          {links.map((link) => (
            <li key={link._id}>
              {link.url.startsWith("http") ? (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    maxWidth: "50%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                  }}
                  title={link.url}
                >
                  {link.url}
                </a>
              ) : (
                link.url
              )}
              <button
                onClick={() => handleDeleteAttachment(link._id, "link")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  marginLeft: "10px",
                  padding: "0",
                  alignItems: "center",
                  color: "red",
                }}
                title="Delete"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Attachments;
