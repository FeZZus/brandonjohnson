'use client';

export default function GraphModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[2000]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Modal Title</h3>
        <p className="text-gray-600 mb-6">This is the modal content. You can add anything here!</p>
        
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
