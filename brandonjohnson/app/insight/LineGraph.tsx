'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface LineGraphProps {
    data?: Array<{ name: string; value: number }>;
    title?: string;
}

export default function LineGraph({ data, title = 'Line Graph' }: LineGraphProps) {
    // Sample data if none is provided
    const defaultData = [
        { name: 'Jan', value: 400 },
        { name: 'Feb', value: 300 },
        { name: 'Mar', value: 500 },
        { name: 'Apr', value: 450 },
        { name: 'May', value: 600 },
        { name: 'Jun', value: 550 },
        { name: 'Jul', value: 700 },
    ];

    const chartData = data || defaultData;

    return (
        <div className="w-full h-full flex flex-col">
            <h4 className="text-lg font-semibold text-slate-300 mb-4">{title}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                    <Legend wrapperStyle={{ color: '#94a3b8' }} />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        dot={{ fill: '#94a3b8', r: 4 }}
                        activeDot={{ r: 6, fill: '#cbd5e1' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
