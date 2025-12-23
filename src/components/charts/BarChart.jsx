'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, label, valueFormatter = (value) => value }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
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

export function BarChart({
  data = [],
  xAxisDataKey = 'name',
  barDataKeys = [],
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  height = 300,
  showLegend = true,
  showGrid = true,
  xAxisFormatter = (value) => value,
  yAxisFormatter = (value) => value,
  tooltipValueFormatter = (value) => value,
  layout = 'horizontal',
  barSize = 30,
  ...props
}) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const isVertical = layout === 'vertical';
  const XAxisComponent = isVertical ? YAxis : XAxis;
  const YAxisComponent = isVertical ? XAxis : YAxis;
  const BarComponent = isVertical ? Bar : Bar;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{
            top: 20,
            right: 20,
            left: 0,
            bottom: 5,
          }}
          barSize={barSize}
          {...props}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={!isVertical} horizontal={isVertical} />}
          <XAxisComponent
            dataKey={xAxisDataKey}
            tickFormatter={xAxisFormatter}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            type={isVertical ? 'number' : 'category'}
          />
          <YAxisComponent
            tickFormatter={yAxisFormatter}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={isVertical ? 100 : 60}
            type={isVertical ? 'category' : 'number'}
          />
          <Tooltip 
            content={
              <CustomTooltip 
                valueFormatter={tooltipValueFormatter}
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
          {barDataKeys.map((bar, index) => (
            <BarComponent
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
