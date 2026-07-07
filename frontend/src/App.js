import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";
import Backdrop from "@/components/Backdrop";
import Home from "@/pages/Home";
import NotesHub from "@/pages/NotesHub";
import SemesterPage from "@/pages/SemesterPage";
import SubjectPage from "@/pages/SubjectPage";
import ModulePage from "@/pages/ModulePage";
import PYQsHub from "@/pages/PYQsHub";
import PYQSubject from "@/pages/PYQSubject";
import Syllabus from "@/pages/Syllabus";
import Resources from "@/pages/Resources";
import About from "@/pages/About";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import Viewer from "@/pages/Viewer";
import { useAuth } from "@/lib/auth";

function AdminGate() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-white/60" data-testid="admin-loading">
        Checking session…
      </div>
    );
  }
  return isAuthenticated ? <Admin /> : <AdminLogin />;
}

export default function App() {
  return (
    <div className="App grain" data-testid="app-root">
      <Backdrop />
      <BrowserRouter>
        <Navbar />
        <main className="relative z-10 pb-28 md:pb-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/notes" element={<NotesHub />} />
            <Route path="/notes/sem/:sem" element={<SemesterPage />} />
            <Route path="/notes/subject/:subjectId" element={<SubjectPage />} />
            <Route path="/notes/module/:moduleId" element={<ModulePage />} />
            <Route path="/pyqs" element={<PYQsHub />} />
            <Route path="/pyqs/subject/:subjectId" element={<PYQSubject />} />
            <Route path="/syllabus" element={<Syllabus />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin" element={<AdminGate />} />
            <Route path="/viewer/:fileId" element={<Viewer />} />
          </Routes>
        </main>
        <Footer />
        <MobileNav />
      </BrowserRouter>
    </div>
  );
}
