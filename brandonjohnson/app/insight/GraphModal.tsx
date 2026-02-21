'use client';

import { useState } from 'react';
import LineGraph from './LineGraph';

export default function GraphModal({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState(0);

    if (!isOpen) return null;

    const tabs = ['Tab 1', 'Tab 2', 'Tab 3'];

    return (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[2000]">
            <div className="bg-white rounded-lg shadow-xl w-[900px] h-[600px] flex">
                {/* Main Content */}
                <div className="flex-1 p-6 flex flex-col">
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">{tabs[activeTab]}</h3>

                    <div className="flex-1 mb-6">
                        <LineGraph title={`Graph - ${tabs[activeTab]}`} />
                    </div>

                    <div className="flex gap-4 mt-auto">
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

                {/* Sidebar */}
                <div className="w-24 bg-gray-100 border-l border-gray-200 flex flex-col gap-2 p-4">
                    {tabs.map((tab, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveTab(index)}
                            className={`py-3 px-2 rounded-md font-medium text-sm transition-colors ${activeTab === index
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
