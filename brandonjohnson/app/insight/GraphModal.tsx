'use client';

import type { RankedPostcode } from '../../api/postcodes/route';

interface GraphModalProps {
    isOpen: boolean;
    onClose: () => void;
    postcode?: RankedPostcode | null;
}

export default function GraphModal({ isOpen, onClose, postcode }: GraphModalProps) {
    if (!isOpen) return null;

    // Rank colors matching the map markers
    const rankColors: Record<number, string> = {
        1: '#EF4444', // Red
        2: '#F59E0B', // Orange
        3: '#EAB308', // Yellow
        4: '#3B82F6', // Blue
        5: '#8B5CF6', // Purple
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]"
            onClick={(e) => {
                // Close modal when clicking backdrop
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
                <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-800">
                        {postcode ? `Postcode Details - Rank #${postcode.rank}` : 'Postcode Details'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>

                {postcode ? (
                    <div className="space-y-4">
                        {/* Rank Badge */}
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                                style={{
                                    backgroundColor: rankColors[postcode.rank] || '#6B7280',
                                }}
                            >
                                {postcode.rank}
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Rank</div>
                                <div className="text-lg font-semibold text-gray-800">
                                    #{postcode.rank} {postcode.rank === 1 ? '(Highest)' : postcode.rank === 5 ? '(Lowest)' : ''}
                                </div>
                            </div>
                        </div>

                        {/* Postcode */}
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Postcode</div>
                            <div className="text-xl font-mono font-semibold text-gray-800">
                                {postcode.postcode}
                            </div>
                        </div>

                        {/* Coordinates */}
                        {postcode.lat && postcode.lng && (
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Location</div>
                                <div className="text-sm font-mono text-gray-600">
                                    Lat: {postcode.lat.toFixed(6)}, Lng: {postcode.lng.toFixed(6)}
                                </div>
                            </div>
                        )}

                        {/* Placeholder for future content */}
                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-gray-600 text-sm">
                                Additional details and graphs will be displayed here for postcode {postcode.postcode}.
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-600 mb-6">No postcode selected.</p>
                )}

                <div className="flex gap-4 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
