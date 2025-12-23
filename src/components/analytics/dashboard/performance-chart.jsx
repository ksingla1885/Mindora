'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function PerformanceChart({ data }) {
  if (!data?.assessments?.length) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-md">
        <p className="text-muted-foreground">No assessment data available</p>
      </div>
    );
  }

  const chartData = data.assessments.map(assessment => ({
    name: assessment.title,
    score: assessment.avgScore,
    attempts: assessment.attempts,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
          barSize={30}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            width={40}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border border-gray-200 rounded-md shadow-sm">
                    <p className="font-medium">{payload[0].payload.name}</p>
                    <p className="text-sm">
                      <span className="text-gray-500">Score: </span>
                      <span className="font-medium">{payload[0].value}%</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">Attempts: </span>
                      <span className="font-medium">{payload[0].payload.attempts.toLocaleString()}</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="score" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]}
            name="Average Score"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
