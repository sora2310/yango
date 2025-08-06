import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

/**
 * Contacto muestra la información de contacto para soporte. Los
 * conductores pueden usar esta página para comunicarse con el equipo
 * de atención al cliente de Yango.
 */
function Contacto() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <Sidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="flex-1">
        <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Contáctanos</h2>
          <p className="mb-2">Si tienes preguntas o necesitas soporte, contáctanos:</p>
          <p className="mt-2">
            <strong>Email:</strong> soporte@yango.com
          </p>
          <p className="mt-1">
            <strong>Teléfono:</strong> +57 123 456 789
          </p>
          <p className="mt-4">¡Estamos aquí para ayudarte!</p>
        </div>
      </div>
    </div>
  );
}

export default Contacto;
