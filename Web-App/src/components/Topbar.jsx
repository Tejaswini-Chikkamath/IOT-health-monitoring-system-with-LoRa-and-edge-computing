import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth";
import { ArrowLeft, LogOut } from "lucide-react"; // install lucide-react for icons

export default function Topbar({ 
  title = "Admin Dashboard", 
  children, 
  showBack = true 
}) {
  const nav = useNavigate();

  return (
    <div className="w-full bg-gradient-to-r from-blue-600/90 to-indigo-700/90 backdrop-blur-md text-white px-8 py-5 flex items-center justify-between shadow-xl relative z-50">
      {/* Left Section */}
      <div className="flex items-center gap-4 animate-fade-in">
        {showBack && (
          <button
            onClick={() => nav(-1)}
            className="flex items-center gap-2 bg-white/10 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 transition text-white px-4 py-2 rounded-xl text-sm shadow-md"
          >
            <ArrowLeft size={18} />
            Back
          </button>
        )}
        <h1 className="text-2xl md:text-3xl font-extrabold drop-shadow-lg tracking-wide">
          {title}
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {children}
        <button
          onClick={async () => { 
            await logout(); 
            nav("/login"); 
          }}
          className="flex items-center gap-2 bg-white/10 hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 transition text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
