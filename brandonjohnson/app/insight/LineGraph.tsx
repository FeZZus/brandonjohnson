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
            <h4 className="text-lg font-semibold text-gray-700 mb-4">{title}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{ fill: '#6b7280' }} />
                    <YAxis stroke="#9ca3af" tick={{ fill: '#6b7280' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }} />
                    <Legend wrapperStyle={{ color: '#6b7280' }} />
                    <Line
                        type="monotone"
                        dataKey="value"
                        name={title}
                        stroke="#374151"
                        strokeWidth={2}
                        dot={{ fill: '#374151', r: 4 }}
                        activeDot={{ r: 6, fill: '#111827' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
