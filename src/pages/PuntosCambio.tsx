import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

interface Reward {
  id: string;
  titulo: string;
  puntos: number;
  descripcion: string;
  imgUrl: string;
}

// Catálogo de recompensas de ejemplo. En el futuro puede cargarse desde Firestore.
const rewards: Reward[] = [
  {
    id: 'reward1',
    titulo: 'Cupón de descuento',
    puntos: 100,
    descripcion: '5% de descuento en tu próxima compra',
    imgUrl: '/images/cupon.png',
  },
  {
    id: 'reward2',
    titulo: 'Tarjeta de gasolina',
    puntos: 200,
    descripcion: 'Tarjeta de gasolina por $50',
    imgUrl: '/images/gasolina.png',
  },
  {
    id: 'reward3',
    titulo: 'Merchandising Yango',
    puntos: 300,
    descripcion: 'Paquete de merchandising de la marca',
    imgUrl: '/images/merch.png',
  },
];

function PuntosCambio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const fetchPoints = async () => {
      const uid = localStorage.getItem('uid');
      if (!uid) return;
      const oneWeekAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      const puntosQuery = query(
        collection(db, 'puntos'),
        where('uid', '==', uid),
        where('timestamp', '>=', oneWeekAgo)
      );
      const snapshot = await getDocs(puntosQuery);
      let sum = 0;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        sum += (data.puntos as number) || 0;
      });
      setTotalPoints(sum);
    };
    fetchPoints();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <Sidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="flex-1">
        <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Puntos y Recompensas</h2>
          <p className="mb-6">
            Puntos obtenidos en la última semana:{' '}
            <span className="font-semibold">{totalPoints}</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col items-center shadow-md"
              >
                <img src={reward.imgUrl} alt={reward.titulo} className="w-24 h-24 object-contain mb-2" />
                <h3 className="text-lg font-semibold mb-1 text-center">{reward.titulo}</h3>
                <p className="text-sm text-center mb-2">{reward.descripcion}</p>
                <p className="mb-2">Puntos requeridos: {reward.puntos}</p>
                {totalPoints >= reward.puntos ? (
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Reclamar</button>
                ) : (
                  <button className="bg-gray-500 text-white px-4 py-2 rounded" disabled>
                    Insuficientes
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PuntosCambio;
