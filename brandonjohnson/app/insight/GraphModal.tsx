'use client';

import { useState } from 'react';
import LineGraph from './LineGraph';
import PieChartComponent from './PieChart';

interface RankedPostcode {
    postcode: string;
    rank: number;
    lat?: number;
    lng?: number;
    score?: number;
}

interface GridCellSummary {
    results: {
        filtered: unknown[];
    };
}


export default function GraphModal({ isOpen, onClose, postcode, gridCell, planningBusinessCategories = [], planningApprovalRates = [], incomeSeries = [] }: {
    isOpen: boolean;
    onClose: () => void;
    postcode?: RankedPostcode | null;
    gridCell?: GridCellSummary | null;
    planningBusinessCategories?: { name: string; value: number }[];
    planningApprovalRates?: { name: string; approvalRate: number }[];
    incomeSeries?: { name: string; value: number }[];
}) {
    const [activeTab, setActiveTab] = useState(0);


    if (!isOpen) return null;

    const tabs = ['Business Activity', 'Income', 'Approval Rates'];

    const planningChartPoints = planningBusinessCategories;
    const approvalRatePoints = planningApprovalRates;

    const renderTabContent = () => {
        // If no postcode AND no gridCell, show error
        if (!postcode?.lat && !postcode?.lng && !gridCell) {
            return (
                <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-gray-400">No location data available.</p>
                </div>
            );
        }

        if (activeTab === 0) {
            const chartData = planningChartPoints;
            return chartData.length > 0
                ? <PieChartComponent data={chartData} title="Business Activity By Type" />
                : <div className="flex items-center justify-center h-full text-sm text-gray-400">No business activity data available</div>;
        }

        if (activeTab === 1) {
            return incomeSeries.length > 0
                ? <LineGraph data={incomeSeries} title="Net Household Income (£)" />
                : <div className="flex items-center justify-center h-full text-sm text-gray-400">No income data available</div>;
        }

        if (activeTab === 2) {
            const approvalSource = approvalRatePoints;
            if (approvalSource.length > 0) {
                const approvalData = approvalSource.map(point => ({
                    name: point.name,
                    value: Math.round(point.approvalRate * 10) / 10
                }));
                const overallApprovalRate = approvalSource.reduce((sum, point) => sum + point.approvalRate, 0) / approvalSource.length;
                return (
                    <div className="h-full flex flex-col">
                        <div className="text-sm text-gray-600 mb-3">
                            Overall approval rate: <span className="font-semibold text-gray-800">{Math.round(overallApprovalRate * 10) / 10}%</span>
                        </div>
                        <div className="flex-1 min-h-0">
                            <LineGraph data={approvalData} title="Approval Rates by Year" />
                        </div>
                    </div>
                );
            }
            return <div className="flex items-center justify-center h-full text-sm text-gray-400">No approval rate data available</div>;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-2000">
            <div className="bg-gray-100 border border-gray-300 rounded-xl shadow-2xl w-225 h-175 flex overflow-hidden">
                {/* Main Content */}
                <div className="flex-1 p-6 flex flex-col overflow-hidden relative">
                    <div className="mb-4">
                        <h3 className="text-2xl font-bold text-gray-800">{tabs[activeTab]}</h3>
                        {gridCell && postcode && activeTab === 0 && (
                            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                                <span>{postcode.postcode}</span>
                                {postcode.score != null && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-[#389491] text-[#389491] rounded-md text-xs font-semibold">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/>
                                        </svg>
                                        {postcode.score.toFixed(1)}
                                    </span>
                                )}
                                <span>| Business Activity Index: {gridCell.results.filtered.length}</span>
                            </p>
                        )}
                        {gridCell && postcode && activeTab !== 0 && (
                            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                                <span>{postcode.postcode}</span>
                                {postcode.score != null && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-[#389491] text-[#389491] rounded-md text-xs font-semibold">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/>
                                        </svg>
                                        {postcode.score.toFixed(1)}
                                    </span>
                                )}
                            </p>
                        )}
                        {gridCell && !postcode && activeTab === 0 && (
                            <p className="text-sm text-gray-500 mt-0.5">
                                In this location | Business Activity Index: {gridCell.results.filtered.length}
                            </p>
                        )}
                        {gridCell && !postcode && activeTab !== 0 && (
                            <p className="text-sm text-gray-500 mt-0.5">
                                In this location
                            </p>
                        )}
                        {postcode && !gridCell && (
                            <p className="text-sm text-gray-500 mt-0.5">
                                {postcode.postcode} &mdash; Rank #{postcode.rank}
                            </p>
                        )}
                    </div>

                    <div className="flex-1 min-h-0">
                        {renderTabContent()}
                    </div>

                    <div className="mt-4 pt-4 pb-4 text-center">
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <span className="text-3xl font-bold leading-none select-none" aria-hidden>×</span>
                    </button>
                </div>

                {/* Sidebar - 3 equal sections */}
                <div className="w-16 bg-gray-200 flex flex-col h-full">
                    {tabs.map((tab, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => setActiveTab(index)}
                            className={`flex-1 flex items-center justify-center px-2 font-bold text-s transition-colors duration-300 cursor-pointer last:border-b-0 ${activeTab === index
                                ? 'text-white bg-[#389491]'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800'
                                }`}
                        >
                            <span className="inline-block whitespace-nowrap rotate-[90deg]">
                                {tab}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}