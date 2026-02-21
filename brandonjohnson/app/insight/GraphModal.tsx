'use client';

import { useState } from 'react';
import LineGraph from './LineGraph';
import PieChartComponent from './PieChart';

export default function GraphModal({ isOpen, onClose, postcode }: { isOpen: boolean; onClose: () => void; postcode?: { postcode: string; rank: number } | null }) {
    const [activeTab, setActiveTab] = useState(0);

    if (!isOpen) return null;

    const tabs = ['Tab 1', 'Tab 2', 'Tab 3'];

    return (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-[2000]">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-[900px] h-[600px] flex overflow-hidden">
                {/* Main Content */}
                <div className="flex-1 p-6 flex flex-col">
                    <h3 className="text-2xl font-bold text-slate-100 mb-4">{tabs[activeTab]}</h3>

                    <div className="flex-1 mb-6">
                        {activeTab === 0 && <LineGraph title={`Graph - ${tabs[activeTab]}`} />}
                        {activeTab === 1 && <PieChartComponent title={`Chart - ${tabs[activeTab]}`} />}
                        {activeTab === 2 && <LineGraph title={`Graph - ${tabs[activeTab]}`} />}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-1/3 bg-slate-700 text-slate-200 px-4 py-2 rounded-md hover:bg-slate-600 transition-colors font-medium mt-auto mx-auto border border-slate-600"
                    >
                        Close
                    </button>
                </div>

                {/* Sidebar */}
                <div className="w-24 bg-slate-800 border-l border-slate-700 flex flex-col gap-2 p-4">
                    {tabs.map((tab, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveTab(index)}
                            className={`py-3 px-2 rounded-md font-medium text-sm transition-colors ${activeTab === index
                                ? 'bg-slate-600 text-slate-100'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
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