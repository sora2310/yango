import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, Search, ChevronDown, ShieldCheck, User as UserIcon, Settings, Home } from 'lucide-react';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

type HeaderProps = {
  /** Muestra breadcrumbs simples: true por defecto */
  showBreadcrumbs?: boolean;
  /** Muestra caja de búsqueda (solo UI): false por defecto */
  showSearch?: boolean;
  /** Placeholder del buscador */
  searchPlaceholder?: string;
};

const Header: React.FC<HeaderProps> = ({
  showBreadcrumbs = true,
  showSearch = false,
  searchPlaceholder = 'Buscar…',
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [openUser, setOpenUser] = React.useState(false);
  const [displayName, setDisplayName] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>('');
  const [avatarUrl, setAvatarUrl] = React.useState<string>('');
  const [role, setRole] = React.useState<'admin' | 'driver' | null>(null);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    const uid = auth.currentUser?.uid || localStorage.getItem('uid');
    const cachedRole = (localStorage.getItem('rol') as 'admin' | 'driver' | null) || null;
    setRole(cachedRole);

    if (!uid) return;

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'usuarios', uid));
        if (snap.exists()) {
          const d = snap.data() as any;
          const name = [d?.nombre, d?.apellido].filter(Boolean).join(' ') || d?.nombre || '';
          setDisplayName(name);
          setEmail(d?.email || auth.currentUser?.email || '');
          setAvatarUrl(d?.avatarUrl || '');
          if (d?.rol && d.rol !== cachedRole) {
            setRole(d.rol);
            localStorage.setItem('rol', d.rol);
          }
        } else {
          // fallback solo con auth
          setDisplayName(auth.currentUser?.displayName || '');
          setEmail(auth.currentUser?.email || '');
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  React.useEffect(() => {
    // cerrar dropdown al cambiar de ruta
    setOpenUser(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('rol');
    localStorage.removeItem('uid');
    navigate('/');
  };

  // Breadcrumbs simples basados en la ruta
  const crumbs = React.useMemo(() => {
    if (!showBreadcrumbs) return [];
    const parts = location.pathname.split('/').filter(Boolean);
    const acc: { label: string; to: string }[] = [];
    let path = '';
    for (const p of parts) {
      path += `/${p}`;
      acc.push({
        label: p
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        to: path,
      });
    }
    return acc;
  }, [location.pathname, showBreadcrumbs]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Top row */}
        <div className="h-14 flex items-center justify-between gap-3">
          {/* Left: logo + breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to={role === 'admin' ? '/admin' : '/panel'} className="shrink-0">
              <img src="/logo.png" alt="Yango" className="h-7 w-auto" />
            </Link>

            {showBreadcrumbs && (
              <nav className="hidden md:flex items-center gap-2 text-sm text-gray-500 truncate">
                <Home className="w-4 h-4" />
                {crumbs.length === 0 ? (
                  <span className="truncate">Inicio</span>
                ) : (
                  crumbs.map((c, i) => (
                    <React.Fragment key={c.to}>
                      <span className="text-gray-300">/</span>
                      {i < crumbs.length - 1 ? (
                        <Link to={c.to} className="hover:text-gray-700 truncate">
                          {c.label}
                        </Link>
                      ) : (
                        <span className="text-gray-700 font-medium truncate">{c.label}</span>
                      )}
                    </React.Fragment>
                  ))
                )}
              </nav>
            )}
          </div>

          {/* Center: search (opcional) */}
          {showSearch && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Aquí puedes navegar a una ruta de búsqueda si quieres
                // navigate(`/buscar?q=${encodeURIComponent(search)}`);
              }}
              className="hidden md:flex items-center gap-2 flex-1 max-w-lg"
            >
              <div className="relative w-full">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </form>
          )}

          {/* Right: user menu */}
          <div className="ml-auto flex items-center gap-2">
            {role === 'admin' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-800">
                <ShieldCheck className="w-3 h-3" />
                Admin
              </span>
            )}

            <button
              onClick={() => setOpenUser((s) => !s)}
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 transition"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover border"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 grid place-items-center">
                  <UserIcon className="w-4 h-4 text-gray-600" />
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm leading-4 text-gray-800 font-medium truncate max-w-[160px]">
                  {displayName || 'Cuenta'}
                </p>
                <p className="text-xs leading-4 text-gray-500 truncate max-w-[160px]">
                  {email || '—'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {/* Dropdown */}
            {openUser && (
              <div className="absolute right-4 top-12 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-1">
                <Link
                  to="/mi-cuenta"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <UserIcon className="w-4 h-4" />
                  Mi cuenta
                </Link>

                {role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    Panel admin
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search (opcional) */}
        {showSearch && (
          <div className="pb-3 md:hidden">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
