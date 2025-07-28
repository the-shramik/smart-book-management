import { useState, useRef } from "react";
import { useNavigate } from "react-router";

export default function CreateBook() {
  const [form, setForm] = useState({
    email: "",
    title: "",
    genre: "",
    author: "",
    pageCount: "",
    description: "",
    img: "", // AI or preview data URL
    read: false,
  });

  const [imgSource, setImgSource] = useState(""); // For showing live preview from uploaded file or AI
  const [generatingAI, setGeneratingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef();
  const navigate = useNavigate();
  const BASE_URL = "http://localhost:8080/api/books";

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }
  // AI: Generate all book details
  async function handleAIGenerate() {
    if (!form.title.trim()) return;
    setGeneratingAI(true);
    setError("");
    try {
      const res = await fetch(
        `${BASE_URL}/generate-ai-book-details?title=${encodeURIComponent(form.title)}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to generate details");
      const data = await res.json();
      setForm(f => ({
        ...f,
        title: data.title || f.title,
        genre: data.genre || "",
        author: data.author || "",
        pageCount: data.pageCount || "",
        description: data.description || "",
        img: data.coverImage
          ? `data:image/png;base64,${data.coverImage}`
          : "",
      }));
      // Update preview if there's an AI image and no uploaded image
      if (!fileInputRef.current?.files[0] && data.coverImage) {
        setImgSource(`data:image/png;base64,${data.coverImage}`);
      }
    } catch (err) {
      setError(err.message || "Error generating book details");
    } finally {
      setGeneratingAI(false);
    }
  }

  // Submit book (with image: file upload or AI image)
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const bookData = {
        userEmail: form.email,
        title: form.title,
        genre: form.genre,
        author: form.author,
        pageCount: form.pageCount,
        description: form.description,
        read: form.read,
      };
      const formData = new FormData();
      formData.append(
        "book",
        new Blob([JSON.stringify(bookData)], { type: "application/json" })
      );
      // Prefer file input, else use AI image if present
      let file = fileInputRef.current?.files[0];
      if (!file && form.img && form.img.startsWith("data:image/")) {
        // Convert base64 to Blob/File (PNG only)
        const byteString = atob(form.img.split(",")[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        file = new File([ab], "cover.png", { type: "image/png" });
      }
      if (file) formData.append("image", file);

      const res = await fetch(BASE_URL, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to save book");
      const saved = await res.json();
      setSubmittedData(saved);
      setForm({
        email: "",
        title: "",
        genre: "",
        author: "",
        pageCount: "",
        description: "",
        img: "",
        read: false,
      });
      setImgSource("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message || "Error saving book");
    } finally {
      setSubmitting(false);
      navigate('/')
    }
  }

  // Enable/disable logic
  const canSubmit =
    form.email.trim() &&
    form.title.trim() &&
    form.genre.trim() &&
    form.author.trim() &&
    form.pageCount &&
    form.description.trim();

  // Show uploaded file preview, or AI-generated img, or nothing
  const displayedImg =
    imgSource || form.img || "";

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-2 py-8">
      <div className="bg-white rounded-2xl shadow-2xl border border-green-200 w-full max-w-5xl p-8 transition-all duration-200">
        <h2 className="text-3xl font-bold text-green-700 mb-2 tracking-tight text-center">
          Add a New Book
        </h2>
        <p className="text-gray-500 mb-8 text-sm text-center">
          Fill in the details below or generate complete details using BookAI!
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-300 font-semibold shadow">
            {error}
          </div>
        )}

        <form
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          onSubmit={handleSubmit}
        >
          {/* Left: Book Information */}
          <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-5">
            <h3 className="text-lg font-semibold mb-2 text-gray-800 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-2"></span>
              Book Information
            </h3>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Email ID</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-green-100 transition outline-none"
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Title

              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-green-100 transition outline-none"
                placeholder="Book Title"
              />
            </div>
            <div className="w-full">
              <button
                type="button"
                onClick={handleAIGenerate}
                disabled={!form.title.trim() || generatingAI}
                className=" w-full ml-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                style={{ float: "right", marginTop: "-4px" }}
              >
                {generatingAI ? "Filling..." : "Generate Book details with AI"}
              </button>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Genre</label>
              <input
                type="text"
                name="genre"
                value={form.genre}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-green-100 transition outline-none"
                placeholder="e.g. Programming, Fiction"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Author</label>
              <input
                type="text"
                name="author"
                value={form.author}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-green-100 transition outline-none"
                placeholder="Author Name"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Page Count</label>
              <input
                type="number"
                name="pageCount"
                value={form.pageCount}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-green-100 transition outline-none"
                placeholder="Total pages"
              />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                name="read"
                checked={form.read}
                onChange={handleChange}
                className="accent-green-600"
                id="read"
              />
              <label htmlFor="read" className="text-gray-700 font-medium">Already read?</label>
            </div>
            {/* <div>
              <label className="block text-gray-700 font-medium mb-1">Upload Custom Cover Image</label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="w-full"
              />
              {imgSource && (
                <button
                  type="button"
                  className="text-xs text-red-600 underline mt-2"
                  onClick={handleRemoveImage}
                >
                  Remove Uploaded Image
                </button>
              )}
              <span className="text-xs text-gray-400 block">
                Optional: Choose a custom cover (overrides AI image if both selected)
              </span>
            </div> */}
          </section>

          {/* Right: Book Preview (with image!) */}
          <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col gap-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-800 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
              Book Preview
            </h3>
            {/* Always show image area */}
            <div className="flex flex-col items-center mb-3 min-h-[184px]">
              {displayedImg ? (
                <img
                  src={displayedImg}
                  alt="Book Cover"
                  className="w-32 h-44 object-cover rounded-lg shadow border-2 border-purple-200 transition-all duration-200 mb-2"
                />
              ) : (
                <div className="w-32 h-44 flex items-center justify-center bg-white border-2 border-dashed border-purple-200 text-purple-300 rounded-lg">
                  <span className="text-sm">No Cover Image</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={7}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-400 focus:ring-blue-100 transition outline-none"
                placeholder="Describe your book"
              />
            </div>
          </section>

          {/* Submit Button: Stretched across both columns */}
          <div className="lg:col-span-2 flex justify-end pt-4">
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={`bg-green-600 text-white px-8 py-3 rounded-lg text-base font-semibold shadow hover:bg-green-700 transition-all
                ${!canSubmit || submitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {submitting ? "Submitting..." : "Submit Book"}
            </button>
          </div>
        </form>

        {/* Submission Feedback */}
       
      </div>
      {generatingAI && <FullPageLoader />}
    </div>
  );
}
function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 bg-black-300   flex flex-col items-center justify-center" style={{ backdropFilter: "blur(5px)" }}>
      <div className="animate-spin rounded-full border-t-4 border-b-4 border-green-500 w-16 h-16 mb-4"></div>
      <div className="text-black text-xl font-semibold">Generating book details with AI...</div>
    </div>
  );
}
