'use client';

import { useState, useEffect } from 'react';
import LineGraph from './LineGraph';
import PieChartComponent from './PieChart';

interface RankedPostcode {
    postcode: string;
    rank: number;
    lat?: number;
    lng?: number;
}

interface IncomeData {
    msoaCode: string;
    observations: { year: number; income: number }[];
}

interface PlanningData {
    analytics: {
        businessTypeBreakdown: { type: string; count: number }[];
    };
    newBusinessSites: {
        useTypes: { useType: string }[];
        chains: { category: string }[];
    };
}

interface SmallResidentialData {
    meta: { acceptedSmallResidential: number; totalFetched: number };
    acceptedByYear: { year: string; acceptedCount: number }[];
}

export default function GraphModal({ isOpen, onClose, postcode, gridCell, planningBusinessCategories = [], planningApprovalRates = [] }: {
    isOpen: boolean;
    onClose: () => void;
    postcode?: RankedPostcode | null;
    gridCell?: any | null;
    planningBusinessCategories?: { name: string; value: number }[];
    planningApprovalRates?: { name: string; approvalRate: number }[];
}) {
    const [activeTab, setActiveTab] = useState(0);
    const [incomeData, setIncomeData] = useState<IncomeData | null>(null);
    const [planningData, setPlanningData] = useState<PlanningData | null>(null);
    const [smallResidentialData, setSmallResidentialData] = useState<SmallResidentialData | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        
        // Handle grid cell data fetching
        if (gridCell) {
            setLoading(true);
            setFetchError(null);
            setIncomeData(null);
            setPlanningData(null);
            setSmallResidentialData(null);
            setActiveTab(0);

            const lat = gridCell.lat;
            const lng = gridCell.lng;
            const body = { lat, lng, radius: 500, yearsBack: 10 };

            Promise.all([
                fetch('/api/income', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat, lng }),
                }).then(r => r.json()),
                fetch('/api/planning', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat, lng, radius: 500 }),
                }).then(r => r.json()),
                fetch('/api/planning/small-residential', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                }).then(r => r.json()),
            ])
                .then(([income, planning, smallRes]) => {
                    if (!income.error) setIncomeData(income);
                    if (!planning.error) setPlanningData(planning);
                    if (!smallRes.error && smallRes.acceptedByYear) setSmallResidentialData(smallRes);
                })
                .catch(err => setFetchError(err.message))
                .finally(() => setLoading(false));
            return;
        }
        
        // Handle postcode data fetching
        if (!postcode?.lat || !postcode?.lng) return;

        setLoading(true);
        setFetchError(null);
        setIncomeData(null);
        setPlanningData(null);
        setSmallResidentialData(null);
        setActiveTab(0);

        const lat = postcode.lat;
        const lng = postcode.lng;
        const body = { lat, lng, radius: 500, yearsBack: 10 };

        Promise.all([
            fetch('/api/income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lng }),
            }).then(r => r.json()),
            fetch('/api/planning', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lng, radius: 500 }),
            }).then(r => r.json()),
            fetch('/api/planning/small-residential', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            }).then(r => r.json()),
        ])
            .then(([income, planning, smallRes]) => {
                if (!income.error) setIncomeData(income);
                if (!planning.error) setPlanningData(planning);
                if (!smallRes.error && smallRes.acceptedByYear) setSmallResidentialData(smallRes);
            })
            .catch(err => setFetchError(err.message))
            .finally(() => setLoading(false));
    }, [isOpen, postcode?.postcode, gridCell]);

    if (!isOpen) return null;

    const tabs = ['Small residential', 'Income', 'Planning', 'New Sites'];

    // Transform API data into chart-ready shape
    const incomeChartData = incomeData?.observations.map(o => ({
        name: String(o.year),
        value: o.income,
    })) ?? [];

    const planningChartData = planningData?.analytics.businessTypeBreakdown.map(b => ({
        name: b.type,
        value: b.count,
    })) ?? [];

    const newSitesChartData = (() => {
        if (!planningData) return [];
        const counts: Record<string, number> = {};
        for (const match of planningData.newBusinessSites.useTypes) {
            counts[match.useType] = (counts[match.useType] ?? 0) + 1;
        }
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => ({ name, value }));
    })();

    const smallResidentialChartData = (smallResidentialData?.acceptedByYear ?? []).map(({ year, acceptedCount }) => ({
        name: year,
        value: acceptedCount,
    }));

    const renderTabContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
                        <span className="text-sm text-gray-500">Loading data...</span>
                    </div>
                </div>
            );
        }

        if (fetchError) {
            return (
                <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-red-600">{fetchError}</p>
                </div>
            );
        }

        // If no postcode AND no gridCell, show error
        if (!postcode?.lat && !postcode?.lng && !gridCell) {
            return (
                <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-gray-400">No location data available.</p>
                </div>
            );
        }

        if (activeTab === 0) {
            return smallResidentialChartData.length > 0
                ? <LineGraph data={smallResidentialChartData} title="Accepted small residential planning applications (by decided year)" />
                : <div className="flex items-center justify-center h-full text-sm text-gray-400">No small residential data available.</div>;
        }

        if (activeTab === 1) {
            return incomeChartData.length > 0
                ? <LineGraph data={incomeChartData} title="Net Household Income (£)" />
                : <div className="flex items-center justify-center h-full text-sm text-gray-400">No income data available</div>;
        }

        if (activeTab === 2) {
            // Show aggregated business categories from search area if available
            if (planningBusinessCategories.length > 0) {
                return <PieChartComponent data={planningBusinessCategories} title="Business Categories in Search Area" />;
            }
            // Fall back to postcode-specific planning data
            return planningChartData.length > 0
                ? <PieChartComponent data={planningChartData} title="Planning Applications by Business Type" />
                : <div className="flex items-center justify-center h-full text-sm text-gray-400">No planning data available</div>;
        }

        if (activeTab === 3) {
            // Show aggregated approval rates from search area if available
            if (planningApprovalRates.length > 0) {
                const approvalData = planningApprovalRates.map(point => ({
                    name: point.name,
                    value: Math.round(point.approvalRate * 10) / 10
                }));
                return <LineGraph data={approvalData} title="Approval Rates by Year (Search Area)" />;
            }
            // Fall back to postcode-specific new sites data
            return newSitesChartData.length > 0
                ? <PieChartComponent data={newSitesChartData} title="New Business Sites by Use Type" />
                : <div className="flex items-center justify-center h-full text-sm text-gray-400">No new business site data available</div>;
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
                <div className="w-24 bg-gray-200 border-l border-gray-300 flex flex-col gap-2 p-4">
                    {tabs.map((tab, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveTab(index)}
                            className={`py-3 px-2 rounded-lg font-medium text-sm transition-colors ${activeTab === index
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