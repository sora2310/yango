import React from 'react';
import { Menu } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

/**
 * Header renders the top navigation bar used across pages. It contains
 * a burger menu for mobile, the Yango brand name and a logout
 * button that signs the user out using Firebase auth.
 */
const Header: React.FC<HeaderProps> = ({ menuOpen, setMenuOpen }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('uid');
    localStorage.removeItem('rol');
    navigate('/');
  };

  return (
    <header className="flex items-center justify-between bg-black text-white px-4 py-3 shadow-md">
      <button className="md:hidden focus:outline-none" onClick={() => setMenuOpen(!menuOpen)}>
        <Menu size={24} />
      </button>
      <div className="flex-1 flex justify-center md:justify-start">
        <h1 className="text-xl font-bold">Yango</h1>
      </div>
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
      >
        Cerrar sesión
      </button>
    </header>
  );
};

export default Header;
