import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function Contacto() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <div className="p-6 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Contáctanos</h2>
          <p className="mb-2">Si tienes preguntas o necesitas soporte, contáctanos:</p>

          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow mb-6">
            <p className="mb-1"><span className="font-semibold">Correo:</span> soporte@yango.app</p>
            <p className="mb-1"><span className="font-semibold">Teléfono:</span> +57 300 000 0000</p>
            <p className="mb-1"><span className="font-semibold">Horario:</span> Lun–Vie, 9:00–18:00</p>
          </div>

          <form className="bg-white rounded-lg border border-gray-200 p-4 shadow grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border border-gray-300 rounded p-3" placeholder="Tu nombre" />
            <input className="border border-gray-300 rounded p-3" placeholder="Tu email" type="email" />
            <input className="md:col-span-2 border border-gray-300 rounded p-3" placeholder="Asunto" />
            <textarea className="md:col-span-2 border border-gray-300 rounded p-3 min-h-[120px]" placeholder="Mensaje" />
            <button className="md:col-span-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded">
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
