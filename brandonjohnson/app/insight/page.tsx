'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./DynamicMap'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full">Loading map...</div>
});

export default function InsightPage() {
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [mapKey, setMapKey] = useState(0);

    // Force map to re-render when panels change
    useEffect(() => {
        const timer = setTimeout(() => {
            setMapKey(prev => prev + 1);
        }, 300); // Match the transition duration
        return () => clearTimeout(timer);
    }, [leftPanelOpen, rightPanelOpen]);

    return (
        <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
            {/* Left Panel */}
            <div
                className={`transition-all duration-300 ease-in-out bg-white shadow-lg flex-shrink-0 ${leftPanelOpen ? 'w-80' : 'w-0'
                    } overflow-hidden`}
            >
                <div className="p-6 w-80 h-full">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Left Panel</h2>
                    <p className="text-gray-600">Content for the left panel goes here.</p>
                </div>
            </div>

            {/* Toggle Left Panel Button */}
            <button
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-[1000] bg-white shadow-lg rounded-r-md p-3 hover:bg-gray-100 transition-all"
                style={{ left: leftPanelOpen ? '320px' : '0px', transition: 'left 0.3s ease-in-out' }}
            >
                <span className="text-lg font-bold">{leftPanelOpen ? '‹' : '›'}</span>
            </button>

            {/* Map Container */}
            <div className="flex-1 relative h-full">
                <DynamicMap key={mapKey} />
            </div>

            {/* Toggle Right Panel Button */}
            <button
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-[1000] bg-white shadow-lg rounded-l-md p-3 hover:bg-gray-100 transition-all"
                style={{ right: rightPanelOpen ? '320px' : '0px', transition: 'right 0.3s ease-in-out' }}
            >
                <span className="text-lg font-bold">{rightPanelOpen ? '›' : '‹'}</span>
            </button>

            {/* Right Panel */}
            <div
                className={`transition-all duration-300 ease-in-out bg-white shadow-lg flex-shrink-0 ${rightPanelOpen ? 'w-80' : 'w-0'
                    } overflow-hidden`}
            >
                <div className="p-6 w-80 h-full">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Right Panel</h2>
                    <p className="text-gray-600">Content for the right panel goes here.</p>
                </div>
            </div>
        </div>
    );
}
