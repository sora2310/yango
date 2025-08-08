import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, Gift, UserCircle, Phone } from 'lucide-react';

interface SidebarProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

/**
 * Sidebar claro con borde derecho y activo en rojo.
 */
const Sidebar: React.FC<SidebarProps> = ({ menuOpen, setMenuOpen }) => {
  return (
    <aside
      className={`bg-white text-gray-800 w-64 p-4 md:relative fixed inset-y-0 left-0 transform ${
        menuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition-transform duration-200 ease-in-out z-40 border-r border-gray-200 shadow`}
    >
      <div className="mb-8 flex justify-center">
        {/* Sustituye '/logo.png' por la ruta de tu logo en la carpeta public */}
        <img src="/logo.png" alt="Yango" className="h-12 w-auto" />
      </div>
      <nav className="space-y-4">
        <NavLink
          to="/panel"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-2 py-2 rounded hover:text-red-600 ${
              isActive ? 'text-red-600 font-medium' : ''
            }`
          }
          onClick={() => setMenuOpen(false)}
        >
          <Home size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/panel"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-2 py-2 rounded hover:text-red-600 ${
              isActive ? 'text-red-600 font-medium' : ''
            }`
          }
          onClick={() => setMenuOpen(false)}
        >
          <User size={20} />
          <span>Conductor</span>
        </NavLink>

        <NavLink
          to="/puntos-cambio"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-2 py-2 rounded hover:text-red-600 ${
              isActive ? 'text-red-600 font-medium' : ''
            }`
          }
          onClick={() => setMenuOpen(false)}
        >
          <Gift size={20} />
          <span>Puntos y Cambio</span>
        </NavLink>

        <NavLink
          to="/mi-cuenta"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-2 py-2 rounded hover:text-red-600 ${
              isActive ? 'text-red-600 font-medium' : ''
            }`
          }
          onClick={() => setMenuOpen(false)}
        >
          <UserCircle size={20} />
          <span>Mi Cuenta</span>
        </NavLink>

        <NavLink
          to="/contacto"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-2 py-2 rounded hover:text-red-600 ${
              isActive ? 'text-red-600 font-medium' : ''
            }`
          }
          onClick={() => setMenuOpen(false)}
        >
          <Phone size={20} />
          <span>Contáctanos</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
