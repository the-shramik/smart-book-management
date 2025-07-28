// src/components/Navbar.jsx
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Create a Book", to: "/create" },
  { label: "BookAIBot", to: "/ai-bot" }
];

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <nav className="bg-black text-white px-6 py-3 flex items-center gap-8 shadow-md">
      <span className="font-bold text-2xl text-green-500">Telusko Books</span>
      <div className="flex gap-5 ml-10">
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`px-3 py-1 rounded-lg hover:bg-green-700 transition ${
              pathname === link.to ? "bg-green-600" : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
