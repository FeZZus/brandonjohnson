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
            <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
