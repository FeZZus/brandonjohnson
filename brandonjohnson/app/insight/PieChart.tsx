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

const COLORS = ['#94a3b8', '#64748b', '#cbd5e1', '#475569', '#7c8fa3', '#b0bec5', '#546e7a', '#90a4ae'];

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
            <h4 className="text-lg font-semibold text-slate-300 mb-4">{title}</h4>
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
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                    <Legend wrapperStyle={{ color: '#94a3b8' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
