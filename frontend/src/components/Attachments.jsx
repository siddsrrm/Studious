import React, { useState, useEffect, useRef } from "react";
import "../css/Attachments.css";
import { ImageConfig } from "../../../backend/config/imageConfig";

const API = import.meta.env.VITE_API_URL;

const Attachments = ({ taskId, token }) => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [links, setLinks] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [networkError, setNetworkError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAttachments() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/attachments?taskId=${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          setNetworkError(data.message || "Failed to load attachments.");
          return;
        }

        const files = data.filter((a) => a.type === "file");
        const links = data.filter((a) => a.type === "link");

        setFiles(files);
        setLinks(links);
      } catch (err) {
        if (err.name !== "AbortError") {
          setNetworkError("Network error. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchAttachments();

    return () => controller.abort();
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
        setNetworkError(data.message || "Failed to create attachment.");
        return;
      }
      if (type === "file") setFiles((prev) => [...prev, data]);
      if (type === "link") setLinks((prev) => [...prev, data]);
    } catch {
      setNetworkError("Network error. Please try again.");
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
        setNetworkError(data.message || "Failed to update attachment.");
        return;
      }
      if (type === "file")
        setFiles((prev) => prev.map((f) => (f._id === id ? data : f)));
      if (type === "link")
        setLinks((prev) => prev.map((l) => (l._id === id ? data : l)));
    } catch {
      setNetworkError("Network error. Please try again.");
    }
  };

  const handleDeleteAttachment = async (id, type) => {
    try {
      const res = await fetch(`${API}/attachments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setNetworkError("Failed to delete attachment.");
        return;
      }
      if (type === "file") setFiles((prev) => prev.filter((f) => f._id !== id));
      if (type === "link") setLinks((prev) => prev.filter((l) => l._id !== id));
    } catch {
      setNetworkError("Network error. Please try again.");
    }
  };

  const normalizeUrl = (url) => {
    try {
      const withProtocol = url.startsWith("http") ? url : `https://${url}`;
      const parsed = new URL(withProtocol);
      return parsed.hostname + parsed.pathname + parsed.search;
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

    const alreadyExists = links.some((link) => {
      const existing = normalizeUrl(link.url);
      return existing && existing === normalized;
    });

    if (alreadyExists) {
      setError("Link already exists!");
      return;
    }

    const finalUrl = trimmed.startsWith("http")
      ? trimmed
      : `https://${trimmed}`;

    handleAddAttachment({ type: "link", url: finalUrl });
    setInputValue("");
    setError("");
  };

  const handleFilesDropped = async (files) => {
    setUploading(true);
    try {
      await Promise.all(
        files.map(async (file) => {
          const uploadRes = await uploadFile(file);
          if (!uploadRes) return;

          return handleAddAttachment({
            type: "file",
            filename: uploadRes.filename,
            fileUrl: uploadRes.fileUrl,
            size: file.size,
            mimeType: file.type,
          });
        }),
      );
      if (!uploadRes) {
        setNetworkError(`Failed uploading ${file.name}`);
        return;
      }
    } catch {
      setNetworkError("Network error. Please try again.");
    } finally {
      setUploading(false);
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
        setNetworkError(data.message || "Upload failed");
        return;
      }

      return data;
    } catch {
      setNetworkError("Upload error");
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      {networkError && <p style={{ color: "red" }}>{networkError}</p>}
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
      <div style={{ marginTop: "20px" }}>
        <h3>Files</h3>

        <ul>
          {files.map((file) => (
            <li
              key={file._id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
              }}
            >
              {/* File info + download link */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    maxWidth: "50%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                  }}
                  title={file.filename}
                >
                  {file.filename}
                </a>

                <small style={{ color: "#666" }}>
                  {file.mimeType} • {formatSize(file.size)}
                </small>
              </div>

              {/* Delete button (same style as links) */}
              <button
                onClick={() => handleDeleteAttachment(file._id, "file")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  marginLeft: "10px",
                  padding: "0",
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
      <DropFileInput onFilesDropped={handleFilesDropped} />
      {uploading && <p>Uploading files...</p>}
    </>
  );
};

const DropFileInput = ({ onFilesDropped }) => {
  const wrapperRef = useRef(null);

  const onDragEnter = () => wrapperRef.current.classList.add("dragover");
  const onDragLeave = () => wrapperRef.current.classList.remove("dragover");
  const onDrop = (e) => {
    e.preventDefault();
    wrapperRef.current.classList.remove("dragover");

    const files = Array.from(e.dataTransfer.files);

    if (files.length) {
      onFilesDropped?.(files);
    }
  };

  const onFileDrop = (e) => {
    const files = Array.from(e.target.files);

    if (files.length) {
      onFilesDropped?.(files);
    }

    e.target.value = null;
  };

  return (
    <div
      ref={wrapperRef}
      className="drop-file-input"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="drop-file-input__label">
        <img
          src="https://media.geeksforgeeks.org/wp-content/uploads/20240308113922/Drag-.png"
          alt=""
        />
        <p>Drag & Drop your files here</p>
      </div>

      <input type="file" multiple onChange={onFileDrop} />
    </div>
  );
};

export default Attachments;
