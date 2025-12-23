'use client';

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Dot,
} from 'recharts';
import { format } from 'date-fns';

const CustomDot = (props) => {
  const { cx, cy, payload, active } = props;
  if (!active) return null;
  
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#6b7280" fontSize={12}>
        {payload.value}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload, label, valueFormatter = (value) => value, dateFormat = 'MMM d' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm text-gray-500 mb-1">
          {format(new Date(label), dateFormat)}
        </p>
        {payload.map((entry, index) => (
          <div key={`tooltip-${index}`} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: entry.color }}
            />
            <p className="text-sm">
              {entry.name}: <span className="font-medium">
                {valueFormatter(entry.value, entry.dataKey)}
              </span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function LineChart({
  data = [],
  xAxisDataKey = 'period',
  lineDataKeys = [],
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  height = 300,
  showLegend = true,
  showGrid = true,
  showDots = true,
  xAxisFormatter = (value) => format(new Date(value), 'MMM d'),
  yAxisFormatter = (value) => value,
  tooltipValueFormatter = (value) => value,
  tooltipDateFormatter = 'MMM d, yyyy',
  ...props
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
            right: 20,
            left: 0,
            bottom: 5,
          }}
          {...props}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
          <XAxis
            dataKey={xAxisDataKey}
            tickFormatter={xAxisFormatter}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tickFormatter={yAxisFormatter}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip 
            content={
              <CustomTooltip 
                valueFormatter={tooltipValueFormatter}
                dateFormat={tooltipDateFormatter}
              />
            } 
          />
          {showLegend && (
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          )}
          {lineDataKeys.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={showDots ? { r: 4 } : false}
              activeDot={showDots ? { r: 6 } : false}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
