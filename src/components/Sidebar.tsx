import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, Gift, UserCircle, Phone } from 'lucide-react';

interface SidebarProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

/**
 * Sidebar renders the left navigation menu for drivers. It collapses on
 * mobile and uses NavLink to highlight the active route. A logo
 * placeholder is included at the top — replace `/logo.png` with
 * your actual logo path in the public folder.
 */
const Sidebar: React.FC<SidebarProps> = ({ menuOpen, setMenuOpen }) => {
  return (
    <aside
      className={`bg-black text-white w-64 p-4 md:relative fixed inset-y-0 left-0 transform ${
        menuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition-transform duration-200 ease-in-out z-40`}
    >
      <div className="mb-8 flex justify-center">
        {/* Sustituye '/logo.png' por la ruta de tu logo en la carpeta public */}
        <img src="/logo.png" alt="Yango" className="h-12 w-auto" />
      </div>
      <nav className="space-y-4">
        <NavLink
          to="/panel"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-2 py-2 rounded hover:text-red-500 ${
              isActive ? 'text-red-500' : ''
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
            `flex items-center space-x-3 px-2 py-2 rounded hover:text-red-500 ${
              isActive ? 'text-red-500' : ''
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
            `flex items-center space-x-3 px-2 py-2 rounded hover:text-red-500 ${
              isActive ? 'text-red-500' : ''
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
            `flex items-center space-x-3 px-2 py-2 rounded hover:text-red-500 ${
              isActive ? 'text-red-500' : ''
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
            `flex items-center space-x-3 px-2 py-2 rounded hover:text-red-500 ${
              isActive ? 'text-red-500' : ''
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
