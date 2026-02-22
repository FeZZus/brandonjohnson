'use client';

import { useState } from 'react';
import LineGraph from './LineGraph';
import PieChartComponent from './PieChart';

interface RankedPostcode {
    postcode: string;
    rank: number;
    lat?: number;
    lng?: number;
}


export default function GraphModal({ isOpen, onClose, postcode, gridCell, planningBusinessCategories = [], planningApprovalRates = [], incomeSeries = [] }: {
    isOpen: boolean;
    onClose: () => void;
    postcode?: RankedPostcode | null;
    gridCell?: any | null;
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
                ? <PieChartComponent data={chartData} title="Business Activity" />
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
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[2000]">
            <div className="bg-gray-100 border border-gray-300 rounded-xl shadow-2xl w-[900px] h-[600px] flex overflow-hidden">
                {/* Main Content */}
                <div className="flex-1 p-6 flex flex-col overflow-hidden">
                    <div className="mb-4">
                        <h3 className="text-2xl font-bold text-gray-800">{tabs[activeTab]}</h3>
                        {gridCell && (
                            <p className="text-sm text-gray-500 mt-0.5">
                                Grid Cell • {gridCell.results.filtered.length} businesses
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

                    <button
                        onClick={onClose}
                        className="w-1/3 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium mt-4 mx-auto border border-gray-400"
                    >
                        Close
                    </button>
                </div>

                {/* Sidebar */}
                <div className="w-28 bg-gray-200 border-l border-gray-300 flex flex-col gap-2 p-4">
                    {tabs.map((tab, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveTab(index)}
                            className={`py-3 px-2 rounded-lg font-medium text-xs text-center leading-tight break-words whitespace-normal transition-colors ${activeTab === index
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-300 text-gray-600 hover:bg-gray-400 hover:text-gray-800'
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