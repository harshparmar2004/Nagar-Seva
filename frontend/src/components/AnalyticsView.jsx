import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { BarChart2, PieChart as PieIcon, TrendingUp, AlertTriangle } from 'lucide-react';

const COLORS = ['#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12', '#431407'];

export default function AnalyticsView() {
  const [data] = useState({
    categories: [
      { name: 'Sanitation & Drainage', count: 480 },
      { name: 'Roads & Infrastructure', count: 230 },
      { name: 'Water Supply', count: 180 },
      { name: 'Electricity & Lighting', count: 140 },
      { name: 'Healthcare Access', count: 95 },
      { name: 'Education Infra', count: 45 },
    ],
    trend: [
      { month: 'Jun W1', requests: 120 },
      { month: 'Jun W3', requests: 190 },
      { month: 'Jul W1', requests: 310 },
      { month: 'Jul W3', requests: 540 },
      { month: 'Aug W1', requests: 780 },
      { month: 'Aug W3', requests: 1165 },
    ],
    languages: [
      { name: 'Hindi (Standard)', value: 52 },
      { name: 'Malvi Dialect', value: 28 },
      { name: 'Marathi', value: 12 },
      { name: 'English', value: 5 },
      { name: 'Gujarati', value: 3 },
    ],
    budgetMismatch: [
      { ward: 'Ward 14 (Rajendra Ngr)', demand: 94, budget: 0 },
      { ward: 'Ward 15 (Silicon City)', demand: 88, budget: 0 },
      { ward: 'Ward 8 (Banganga)', demand: 82, budget: 25 },
      { ward: 'Ward 7 (Chandan Ngr)', demand: 75, budget: 30 },
      { ward: 'Ward 2 (Vijay Nagar)', demand: 35, budget: 90 },
      { ward: 'Ward 3 (Palasia)', demand: 28, budget: 85 },
    ]
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-2xl font-extrabold text-stone-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-orange-600" /> Multi-Layer Data Fusion Analytics
          </h2>
          <p className="text-xs text-stone-600">Real-time macro insights aggregated across 1,200+ citizen voice requests & government open datasets</p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="bg-orange-100 text-orange-800 font-bold px-3.5 py-1.5 rounded-xl border border-orange-200">
            Average PPI Score: 84.2 / 100
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-orange-600" /> Citizen Voice Request Distribution by Sector
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categories}>
                <XAxis dataKey="name" stroke="#78716c" fontSize={10} tickLine={false} />
                <YAxis stroke="#78716c" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4', borderRadius: '12px', color: '#1c1917' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Monsoon Request Surge Trend (2026)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend}>
                <XAxis dataKey="month" stroke="#78716c" fontSize={10} tickLine={false} />
                <YAxis stroke="#78716c" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4', borderRadius: '12px', color: '#1c1917' }} />
                <Line type="monotone" dataKey="requests" stroke="#ea580c" strokeWidth={3} dot={{ r: 5, fill: '#ea580c' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-amber-600" /> Multilingual Dialect Breakdown (%)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.languages} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.languages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4', borderRadius: '12px', color: '#1c1917' }} />
                <Legend formatter={(value) => <span className="text-xs text-stone-600">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Citizen Demand vs. Municipal Budget Allocated (%)
            </h3>
            <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200">
              MISMATCH IDENTIFIED
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.budgetMismatch}>
                <XAxis dataKey="ward" stroke="#78716c" fontSize={9} tickLine={false} />
                <YAxis stroke="#78716c" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4', borderRadius: '12px', color: '#1c1917' }} />
                <Legend formatter={(value) => <span className="text-xs text-stone-600">{value}</span>} />
                <Bar dataKey="demand" name="Citizen Demand Score" fill="#ea580c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="budget" name="Municipal Budget Allocated" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
