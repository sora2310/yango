import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, User, Gift, UserCircle, Phone, Settings, LogOut } from 'lucide-react';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('rol');
    navigate('/');
  };

  const isAdmin = localStorage.getItem('rol') === 'admin';

  return (
    <aside className="w-64 bg-white shadow-md flex flex-col justify-between min-h-screen">
      <div>
        {/* Logo */}
        <div className="p-4 border-b">
          <img src="/logo.png" alt="Yango" className="h-8 mx-auto" />
        </div>

        {/* Menú principal */}
        <nav className="flex flex-col gap-1 p-4">
          <NavLink
            to="/panel"
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2 rounded transition hover:text-red-600 ${
                isActive ? 'text-red-600 font-medium' : ''
              }`
            }
          >
            <Home size={20} />
            <span>Inicio</span>
          </NavLink>

          <NavLink
            to="/conductor"
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2 rounded transition hover:text-red-600 ${
                isActive ? 'text-red-600 font-medium' : ''
              }`
            }
          >
            <User size={20} />
            <span>Conductor</span>
          </NavLink>

          <NavLink
            to="/puntos-cambio"
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2 rounded transition hover:text-red-600 ${
                isActive ? 'text-red-600 font-medium' : ''
              }`
            }
          >
            <Gift size={20} />
            <span>Puntos y Cambio</span>
          </NavLink>

          <NavLink
            to="/mi-cuenta"
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2 rounded transition hover:text-red-600 ${
                isActive ? 'text-red-600 font-medium' : ''
              }`
            }
          >
            <UserCircle size={20} />
            <span>Mi Cuenta</span>
          </NavLink>

          {/* Solo visible para administradores */}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-2 rounded transition hover:text-red-600 ${
                  isActive ? 'text-red-600 font-medium' : ''
                }`
              }
            >
              <Settings size={20} />
              <span>Admin</span>
            </NavLink>
          )}

          <NavLink
            to="/contacto"
            className={({ isActive }) =>
              `flex items-center gap-3 px-2 py-2 rounded transition hover:text-red-600 ${
                isActive ? 'text-red-600 font-medium' : ''
              }`
            }
          >
            <Phone size={20} />
            <span>Contáctanos</span>
          </NavLink>
        </nav>
      </div>

      {/* Botón de cerrar sesión */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-red-600 hover:text-red-800 w-full px-2 py-2 rounded transition"
        >
          <LogOut size={20} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
