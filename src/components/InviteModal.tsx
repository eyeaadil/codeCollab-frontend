import { X } from 'lucide-react';

interface InviteModalProps {
  show: boolean;
  onClose: () => void;
  email: string;
  onEmailChange: (email: string) => void;
  onSendInvite: () => void;
}

export const InviteModal = ({ show, onClose, email, onEmailChange, onSendInvite }: InviteModalProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Invite Collaborator</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Enter collaborator's email"
          className="w-full px-3 py-2 bg-gray-700 rounded text-white mb-4"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded">
            Cancel
          </button>
          <button onClick={onSendInvite} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
            Send Collaboration Invite
          </button>
        </div>
      </div>
    </div>
  );
};
