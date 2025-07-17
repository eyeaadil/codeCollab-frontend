// components/Dashboard.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification } from './Notification';


interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}


export const Dashboard = () => {
  const [roomIdInput, setRoomIdInput] = useState('');
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!roomIdInput.trim()) {
      setNotification({ message: 'Please enter a Room ID', type: 'error', onClose: () => setNotification(null) });
      return;
    }

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

      if (!token) {
        navigate('/signin');
        return;
      }

      console.log('Token being used:', token);
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });

      const response = await fetch('https://codecollab-backend-1.onrender.com/api/collaborate/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          // 'Accept': 'application/json'
        },
        // credentials: 'include',
        body: JSON.stringify({ roomId: roomIdInput, name: roomIdInput }),
      });

      console.log("resssssssssssssssssssssssssssssss",response)

      console.log('Response status:', response.status);
      // console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) throw new Error(data.message || 'Failed to create room');

      setNotification({ message: 'Room created successfully', type: 'success', onClose: () => setNotification(null) });
      navigate(`/room/${data.roomId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
      console.error('Error details:', error);
      setNotification({ message: errorMessage, type: 'error', onClose: () => setNotification(null) });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create a New Room</h2>
        <input
          type="text"
          value={roomIdInput}
          onChange={(e) => setRoomIdInput(e.target.value)}
          placeholder="Enter Room ID"
          className="w-full px-3 py-2 bg-gray-700 rounded text-white mb-4"
        />
        <button
          onClick={handleCreateRoom}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          Create Room
        </button>
        {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      </div>
    </div>
  );
};

export default Dashboard;