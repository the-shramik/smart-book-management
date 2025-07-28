import { FaEdit, FaTrashAlt } from "react-icons/fa";

export default function BookCard({ book, onEdit, onDelete }) {
  const imageUrl = book.coverImage 
    ? `data:${book.imageType || 'image/png'};base64,${book.coverImage}`
    : '/placeholder-book.png';
console.log("BookCard rendered with book:", book.userEmail);
  return (
    <div className="bg-white rounded-xl shadow-lg p-5 flex flex-col items-center w-64 hover:shadow-2xl transition-shadow duration-300 relative">
      
      <button
        className="absolute top-2 right-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-2 shadow"
        title="Delete"
        onClick={() => onDelete(book)}
      >
        <FaTrashAlt size={16} />
      </button>
      <button
        className="absolute top-2 left-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full p-2 shadow"
        title="Edit"
        onClick={() => onEdit(book)}
      >
        <FaEdit size={16} />
      </button>
      <div className="relative mb-3">
        <img 
          src={imageUrl} 
          alt={book.title} 
          className="w-32 h-44 object-cover rounded-md shadow-md"
          onError={(e) => {
            e.target.src = '/placeholder-book.png';
          }}
        />
        {book.read && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Read
          </div>
        )}
      </div>
      <div className="text-center flex-1">
        <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-gray-600 text-sm mb-2">
          by {book.author} <br></br>Added by  ({book.userEmail})
        </p>
        
        <p className="text-xs text-gray-500 mb-2 line-clamp-3">
          {book.description || book.desc}
        </p>
        <div className="flex justify-between items-center text-xs text-gray-400 mt-auto">
          <span>{book.genre}</span>
          <span>{book.pageCount} pages</span>
        </div>
      </div>
    </div>
  );
}
