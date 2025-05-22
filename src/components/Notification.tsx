import { X } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Notification = ({ message, type, onClose }: NotificationProps) => {
  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2 z-50`}>
      <span>{message}</span>
      <button onClick={onClose} className="hover:text-gray-200">
        <X size={18} />
      </button>
    </div>
  );
};
