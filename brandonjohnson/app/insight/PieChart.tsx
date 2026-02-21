'use client';

import {
    PieChart,
    Pie,
    Cell,
    Legend,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface PieChartProps {
    data?: Array<{ name: string; value: number }>;
    title?: string;
}

const COLORS = ['#1f2937', '#4b5563', '#6b7280', '#9ca3af', '#374151', '#d1d5db', '#111827', '#e5e7eb'];

export default function PieChartComponent({ data, title = 'Pie Chart' }: PieChartProps) {
    // Sample data if none is provided
    const defaultData = [
        { name: 'Category A', value: 30 },
        { name: 'Category B', value: 25 },
        { name: 'Category C', value: 20 },
        { name: 'Category D', value: 15 },
        { name: 'Category E', value: 10 },
    ];

    const chartData = data || defaultData;

    return (
        <div className="w-full h-full flex flex-col">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">{title}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} (${value})`}
                        outerRadius={130}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', color: '#111827' }} />
                    <Legend wrapperStyle={{ color: '#6b7280' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
