// src/App.jsx
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CreateBook from "./pages/CreateBook";
import BookAIBot from "./pages/BookAIBot"; // <-- new

function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateBook />} />
          <Route path="/ai-bot" element={<BookAIBot />} /> {/* new */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
