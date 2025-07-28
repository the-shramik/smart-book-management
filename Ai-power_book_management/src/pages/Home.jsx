import { useEffect, useState, useRef } from "react";
import BookCard from "../components/BookCard";
import BookLoader from "../components/BookLoader";
import { FaMicrophone, FaMicrophoneSlash, FaTimesCircle, FaSearch, FaTimes } from "react-icons/fa";

const API_BASE_URL = "http://localhost:8080/api/books";

function ConfirmModal({ open, onClose, onConfirm, book }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <p>Are you sure you want to delete <b>{book.title}</b>?</p>
        <div className="mt-6 flex justify-center gap-4">
          <button className="bg-gray-300 px-4 py-2 rounded" onClick={onClose}>Cancel</button>
          <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ open, book, onSave, onClose }) {
  const [form, setForm] = useState(book || {});
  useEffect(() => { setForm(book || {}); }, [book]);
  if (!open || !book) return null;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-2xl min-w-[340px] max-w-full w-[95vw] relative">
        <button className="absolute top-3 right-3 text-gray-400 hover:text-red-400 text-xl" onClick={onClose}><FaTimes /></button>
        <h2 className="text-xl font-bold mb-4 text-green-700">Edit Book</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input name="title" value={form.title || ""} onChange={handleChange} required placeholder="Title" className="border px-3 py-2 rounded-lg focus:ring focus:ring-green-100" />
          <input name="author" value={form.author || ""} onChange={handleChange} required placeholder="Author" className="border px-3 py-2 rounded-lg focus:ring focus:ring-green-100" />
          <input name="genre" value={form.genre || ""} onChange={handleChange} required placeholder="Genre" className="border px-3 py-2 rounded-lg focus:ring focus:ring-green-100" />
          <input name="pageCount" type="number" min="1" value={form.pageCount || ""} onChange={handleChange} required placeholder="Page Count" className="border px-3 py-2 rounded-lg focus:ring focus:ring-green-100" />
          <textarea name="description" value={form.description || ""} onChange={handleChange} required placeholder="Description" rows={3} className="border px-3 py-2 rounded-lg focus:ring focus:ring-green-100" />
          <label className="flex gap-2 items-center">
            <input type="checkbox" name="read" checked={!!form.read} onChange={handleChange} className="accent-green-600" />
            <span className="text-gray-600 text-sm">Already read?</span>
          </label>
          <div className="flex gap-4 mt-3">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition">Save Changes</button>
            <button type="button" className="bg-gray-300 px-6 py-2 rounded-lg text-gray-700 font-semibold hover:bg-gray-400 transition" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const [books, setBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteBook, setDeleteBook] = useState(null);
  const [editBook, setEditBook] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [recordedAudio, setRecordedAudio] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => { fetchBooks(); }, []);

  function fetchBooks() {
    setLoading(true);
    setError("");
    fetch(`${API_BASE_URL}/get-books`)
      .then(res => res.ok ? res.json() : Promise.reject("Failed to fetch books."))
      .then(data => { setBooks(data); setAllBooks(data); })
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }

  function handleTextSearch(e) {
    if (e.key === "Enter" || e.type === "click") {
      setLoading(true);
      const formData = new FormData();
      formData.append("query", searchText);

      fetch(`${API_BASE_URL}/voice-text-search`, {
        method: "POST",
        body: formData,
      })
        .then(res => res.ok ? res.json() : Promise.reject("Search failed."))
        .then(data => setBooks(data))
        .catch(() => setBooks([]))
        .finally(() => setLoading(false));
    }
  }

  async function handleSpeechRecord() {
    setVoiceError("");
    setRecordedAudio(null);

    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setVoiceError("This browser does not support voice search.");
      return;
    }
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      setVoiceError("Microphone access denied or unavailable.");
    }
  }

  async function sendAudioToBackend(audioBlob) {
    setVoiceError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch(`${API_BASE_URL}/voice-text-search`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Voice search failed");
      const data = await res.json();
      setBooks(data);
    } catch (err) {
      setVoiceError("Voice search error: " + (err.message || "Unknown error"));
      setBooks([]);
    }
    setLoading(false);
    setRecordedAudio(null);
  }

  function handleClearSearch() {
    setSearchText("");
    setVoiceError("");
    setBooks(allBooks);
  }

  function handleDeleteConfirm() {
    fetch(`${API_BASE_URL}/${deleteBook.id}`, { method: "DELETE" })
      .then(() => { setDeleteBook(null); fetchBooks(); });
  }

  async function handleEditSave(updated) {
    const formData = new FormData();
    formData.append("book", new Blob([JSON.stringify(updated)], { type: "application/json" }));
    await fetch(API_BASE_URL, { method: "PUT", body: formData });
    setEditBook(null);
    fetchBooks();
  }

  return (
    <div className="min-h-[90vh] bg-gray-100 py-8 px-4">
      <h2 className="text-3xl font-bold mb-4 text-center text-gray-900">My Book Library</h2>

      <div className="flex justify-center items-center mb-8 gap-2 flex-wrap">
        <div className="flex items-center rounded-lg border border-gray-300 bg-white shadow px-3 py-1 gap-1 w-full max-w-md">
          <FaSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            className="flex-1 px-2 py-2 bg-transparent focus:outline-none text-base"
            placeholder="Search books by title, author, etc..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyDown={handleTextSearch}
          />
          {searchText && (
            <button className="text-gray-400 hover:text-red-400" onClick={handleClearSearch} title="Clear">
              <FaTimesCircle size={18} />
            </button>
          )}
          <button
            className={`ml-2 px-3 py-2 rounded-full transition-colors ${isRecording ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
            title={isRecording ? "Stop recording" : "Voice search"}
            onClick={handleSpeechRecord}
          >
            {isRecording ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
          </button>
        </div>
        <button
          onClick={e => handleTextSearch({ type: "click" })}
          className="ml-3 px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow"
        >
          Search
        </button>
        {recordedAudio && (
          <button
            onClick={() => sendAudioToBackend(recordedAudio)}
            className="ml-2 px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow"
          >
            Submit Voice
          </button>
        )}
      </div>

      {voiceError && <div className="text-center text-red-600 mb-4 font-semibold">{voiceError}</div>}
      {error && <div className="text-center text-red-600 mb-6 font-semibold">{error}</div>}

      <div className="flex flex-wrap gap-8 justify-center">
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => <BookLoader key={idx} />)
          : books.length
          ? books.map(book => <BookCard key={book.id} book={book} onEdit={setEditBook} onDelete={setDeleteBook} />)
          : <div className="text-gray-400 text-lg mt-10">No books found.</div>}
      </div>

      <ConfirmModal open={!!deleteBook} onClose={() => setDeleteBook(null)} onConfirm={handleDeleteConfirm} book={deleteBook || {}} />
      <EditModal open={!!editBook} book={editBook} onSave={handleEditSave} onClose={() => setEditBook(null)} />
    </div>
  );
}
