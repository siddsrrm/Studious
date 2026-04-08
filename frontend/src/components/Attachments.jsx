import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import "../css/Attachments.css";
import { ImageConfig } from "../../../backend/config/imageConfig";
import { FaTrash } from "react-icons/fa";

const Attachments = () => {
  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

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

    const alreadyExists = items.some(
      (item) => normalizeUrl(item) === normalized,
    );

    if (alreadyExists) {
      setError("Link already exists!");
      return;
    }

    setItems([...items, trimmed]);
    setInputValue("");
    setError("");
  };

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
          {items.map((item, index) => (
            <li key={index}>
              {item.startsWith("http") ? (
                <a
                  href={item}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    maxWidth: "50%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                  }}
                  title={item}
                >
                  {item}
                </a>
              ) : (
                item
              )}
              <button
                onClick={() => setItems(items.filter((_, i) => i !== index))}
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
      <DropFileInput />
    </>
  );
};

const DropFileInput = (props) => {
  const wrapperRef = useRef(null);

  const [fileList, setFileList] = useState([]);

  const onDragEnter = () => wrapperRef.current.classList.add("dragover");

  const onDragLeave = () => wrapperRef.current.classList.remove("dragover");

  const onDrop = () => wrapperRef.current.classList.remove("dragover");

  const onFileDrop = (e) => {
    const newFile = e.target.files[0];
    if (newFile) {
      const updatedList = [...fileList, newFile];
      setFileList(updatedList);
      props.onFileChange(updatedList);
    }
  };

  const fileRemove = (file) => {
    const updatedList = [...fileList];
    updatedList.splice(fileList.indexOf(file), 1);
    setFileList(updatedList);
    props.onFileChange(updatedList);
  };

  return (
    <>
      <div
        ref={wrapperRef}
        className="drop-file-input"
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="drop-file-input__label">
          <img
            src={
              "https://media.geeksforgeeks.org/wp-content/uploads/20240308113922/Drag-.png"
            }
            alt=""
          />
          <p>Drag & Drop your files here</p>
        </div>
        <input type="file" value="" onChange={onFileDrop} />
      </div>
      {fileList.length > 0 ? (
        <div className="drop-file-preview">
          <p className="drop-file-preview__title">Ready to upload</p>
          {fileList.map((item, index) => (
            <div key={index} className="drop-file-preview__item">
              <img
                src={
                  ImageConfig[item.type.split("/")[1]] || ImageConfig["default"]
                }
                alt=""
              />
              <div className="drop-file-preview__item__info">
                <p>{item.name}</p>
                <p>{item.size}B</p>
              </div>
              <span
                className="drop-file-preview__item__del"
                onClick={() => fileRemove(item)}
              >
                x
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
};

DropFileInput.propTypes = {
  onFileChange: PropTypes.func,
};

export default Attachments;
