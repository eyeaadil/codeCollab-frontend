// components/JoinRoom.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Notification } from './Notification';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const JoinRoom = () => {
  const [roomId, setRoomId] = useState('');
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roomIdFromQuery = params.get('roomId');
    if (roomIdFromQuery) {
      setRoomId(roomIdFromQuery);
    }
  }, [location]);

  const handleJoin = async () => {
    if (!roomId.trim()) {
      setNotification({ message: 'Please enter a room ID', type: 'error', onClose: () => setNotification(null) });
      return;
    }

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

      if (!token) {
        navigate(`/signin?roomId=${roomId}`);
        return;
      }

      const response = await fetch('http://localhost:5000/api/collaborate/validate-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to validate room');

      navigate(`/room/${roomId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      setNotification({ message: errorMessage, type: 'error', onClose: () => setNotification(null) });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Join a Room</h2>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room ID"
          className="w-full px-3 py-2 bg-gray-700 rounded text-white mb-4"
        />
        <button
          onClick={handleJoin}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          Join Room
        </button>
        {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      </div>
    </div>
  );
};

export default JoinRoom;