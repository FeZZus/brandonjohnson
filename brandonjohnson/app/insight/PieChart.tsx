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

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

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
            <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
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
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
