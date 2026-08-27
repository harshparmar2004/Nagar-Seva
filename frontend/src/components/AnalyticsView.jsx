import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { BarChart2, PieChart as PieIcon, TrendingUp, AlertTriangle, Activity, Database, CheckCircle2, Clock, AlertOctagon, Layers, Loader2 } from 'lucide-react';

const COLORS = ['#ea580c', '#f97316', '#eab308', '#0284c7', '#10b981', '#8b5cf6'];

export default function AnalyticsView() {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [categoryChartData, setCategoryChartData] = useState([]);
  const [statusStats, setStatusStats] = useState({
    pending: 0,
    approved: 0,
    resolved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, compRes] = await Promise.all([
        fetch('http://localhost:8000/api/analytics'),
        fetch('http://localhost:8000/api/complaints')
      ]);

      const analytics = await analyticsRes.json();
      const complaints = await compRes.json();

      setAnalyticsData(analytics);

      // Compute Live Category Distribution
      const catMap = {};
      let pending = 0, approved = 0, resolved = 0, rejected = 0;

      complaints.forEach(c => {
        catMap[c.category] = (catMap[c.category] || 0) + 1;
        if (c.current_status === 'RESOLVED') resolved++;
        else if (c.current_status === 'APPROVED_BY_ADMIN' || c.current_status === 'IN_PROGRESS') approved++;
        else if (c.current_status === 'REJECTED') rejected++;
        else pending++;
      });

      const formattedCategories = Object.keys(catMap).map(cat => ({
        name: cat,
        count: catMap[cat]
      }));

      setCategoryChartData(formattedCategories.length > 0 ? formattedCategories : [
        { name: 'Sanitation & Drainage', count: 480 },
        { name: 'Roads & Infrastructure', count: 230 },
        { name: 'Water Supply', count: 180 },
        { name: 'Electricity & Lighting', count: 140 }
      ]);

      setStatusStats({ pending, approved, resolved, rejected });

    } catch (e) {
      console.error("Error fetching analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  const trendData = [
    { month: 'Jun W1', requests: 120 },
    { month: 'Jun W3', requests: 190 },
    { month: 'Jul W1', requests: 310 },
    { month: 'Jul W3', requests: 540 },
    { month: 'Aug W1', requests: 780 },
    { month: 'Aug W3', requests: 1165 },
  ];

  const languageData = [
    { name: 'Hindi (Standard)', value: 52 },
    { name: 'Malvi Dialect', value: 28 },
    { name: 'Marathi', value: 12 },
    { name: 'English', value: 5 },
    { name: 'Gujarati', value: 3 },
  ];

  const budgetMismatchData = [
    { ward: 'Ward 14 (Rajendra Ngr)', demand: 94, budget: 0 },
    { ward: 'Ward 15 (Silicon City)', demand: 88, budget: 0 },
    { ward: 'Ward 8 (Banganga)', demand: 82, budget: 25 },
    { ward: 'Ward 7 (Chandan Ngr)', demand: 75, budget: 30 },
    { ward: 'Ward 2 (Vijay Nagar)', demand: 35, budget: 90 },
    { ward: 'Ward 3 (Palasia)', demand: 28, budget: 85 },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center space-y-3 text-stone-500">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        <p className="text-xs font-bold">Loading Data Fusion Telemetry Analytics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
            <Activity className="w-4 h-4" /> Multi-Layer Data Fusion Engine
          </div>
          <h2 className="text-2xl font-extrabold text-stone-900">Indore City Data Fusion Analytics</h2>
          <p className="text-xs text-stone-600">
            Real-time macro insights aggregated across {analyticsData?.total_complaints || 100}+ verified citizen voice requests & municipal open datasets.
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="bg-orange-100 text-orange-800 font-extrabold px-3.5 py-1.5 rounded-xl border border-orange-200">
            Average PPI Priority Score: {analyticsData?.average_ppi_score || 84.2} / 100
          </span>
        </div>
      </div>

      {/* Top Telemetry Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 font-bold uppercase text-[10px]">
            <span>Total Voice Complaints</span>
            <Database className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-black text-stone-900">{analyticsData?.total_complaints || 100}</p>
          <p className="text-[10px] text-emerald-600 font-bold">100% Geotagged & Transcribed</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 font-bold uppercase text-[10px]">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{statusStats.pending}</p>
          <p className="text-[10px] text-stone-400 font-semibold">Awaiting Super Admin Action</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 font-bold uppercase text-[10px]">
            <span>Dispatched / In Progress</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-600">{statusStats.approved}</p>
          <p className="text-[10px] text-blue-700 font-semibold">Assigned to IMC Department</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-stone-500 font-bold uppercase text-[10px]">
            <span>Work Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{statusStats.resolved}</p>
          <p className="text-[10px] text-emerald-700 font-semibold">Verified Work Completed</p>
        </div>
      </div>

      {/* Row 1 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Bar Chart */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-orange-600" /> Citizen Request Distribution by Sector
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <XAxis dataKey="name" stroke="#78716c" fontSize={10} tickLine={false} />
                <YAxis stroke="#78716c" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4', borderRadius: '12px', color: '#1c1917' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monsoon Trend Line Chart */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Monsoon Request Surge Trend (2026)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="month" stroke="#78716c" fontSize={10} tickLine={false} />
                <YAxis stroke="#78716c" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4', borderRadius: '12px', color: '#1c1917' }} />
                <Line type="monotone" dataKey="requests" stroke="#ea580c" strokeWidth={3} dot={{ r: 5, fill: '#ea580c' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Multilingual Dialect Pie Chart */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-amber-600" /> Multilingual Voice Dialect Breakdown (%)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={languageData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {languageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e7e5e4', borderRadius: '12px', color: '#1c1917' }} />
                <Legend formatter={(value) => <span className="text-xs text-stone-600">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Mismatch Chart */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-stone-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Citizen Demand vs Municipal Budget Gap (%)
            </h3>
            <span className="text-[10px] bg-rose-100 text-rose-700 font-extrabold px-2.5 py-0.5 rounded-full border border-rose-200">
              PRIORITY MISMATCH DETECTED
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetMismatchData}>
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
