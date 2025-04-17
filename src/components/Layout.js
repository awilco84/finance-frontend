import { useContext, useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Logo and Navigation */}
      <header className="bg-gray-900 text-white px-10 py-8 flex items-center justify-between shadow-md">
        <div className="text-xl font-bold">Finance Tracker</div>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-4 ">
          <Link to="/dashboard" className="hover:underline">Dashboard</Link>
          <Link to="/upload" className="hover:underline">Upload</Link>
          <Link to="/transactions" className="hover:underline">Transactions</Link>
          <Link to="/budget" className="hover:underline">Budget</Link>
          <Link to="/goals" className="hover:underline">Goals</Link>
          <Link to="/members" className="hover:underline">Members</Link>
          <button onClick={handleLogout} className="ml-4 px-3 py-1 bg-red-900 text-white rounded">Logout</button>
        </nav>
        {/* Mobile Hamburger Icon */}
        <div className="bg-gray-700 text-white margin-2 rounded-lg p-2 md:hidden flex items-center justify-center shadow-lg">
          <button onClick={() => setIsMenuOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="red"
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Semi-transparent overlay that closes the menu on click */}
          <div 
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          {/* Slide-out menu */}
          <div className="fixed inset-y-0 left-0 bg-gray-800 text-white p-4 w-64 transform transition-transform duration-300">
            <div className="flex justify-end mb-4">
              <button onClick={() => setIsMenuOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/dashboard" 
                className="hover:underline" 
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/upload" 
                className="hover:underline" 
                onClick={() => setIsMenuOpen(false)}
              >
                Upload
              </Link>
              <Link 
                to="/transactions" 
                className="hover:underline" 
                onClick={() => setIsMenuOpen(false)}
              >
                Transactions
              </Link>
              <Link 
                to="/budget" 
                className="hover:underline" 
                onClick={() => setIsMenuOpen(false)}
              >
                Budget
              </Link>
              <Link 
                to="/goals" 
                className="hover:underline" 
                onClick={() => setIsMenuOpen(false)}
              >
                Goals
              </Link>
              <Link 
                to="/members" 
                className="hover:underline" 
                onClick={() => setIsMenuOpen(false)}
              >
                Members
              </Link>
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }} 
                className="mt-4 px-3 py-1 bg-red-500 text-white rounded"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-grow p-6">
        <Outlet />
      </main>
    </div>
  );
}
