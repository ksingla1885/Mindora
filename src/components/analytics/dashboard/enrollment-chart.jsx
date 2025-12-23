'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export function EnrollmentChart({ data }) {
  const chartData = useMemo(() => {
    if (!data?.enrollmentTrend) return [];
    
    return data.enrollmentTrend.map(item => ({
      date: format(new Date(item.date), 'MMM d'),
      students: item.count,
    }));
  }, [data]);

  if (!chartData.length) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-md">
        <p className="text-muted-foreground">No enrollment data available</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            width={35}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => {
              if (value >= 1000) return `${value / 1000}k`;
              return value;
            }}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                    <p className="text-sm text-gray-500">{payload[0].payload.date}</p>
                    <p className="font-medium">{payload[0].value} students</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="students" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorStudents)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
