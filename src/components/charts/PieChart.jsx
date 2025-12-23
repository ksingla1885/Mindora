'use client';

import React, { useMemo } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  name,
  value,
  valueFormatter = (val) => val,
  showPercentage = true,
  showValue = false,
  showName = false,
  fontSize = 12,
}) => {
  const radius = 25 + innerRadius + (outerRadius - innerRadius);
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#4b5563"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={fontSize}
    >
      {showName && `${name}: `}
      {showValue && `${valueFormatter(value)}`}
      {showPercentage && `${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, valueFormatter = (value) => value }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900">{data.name}</p>
        <p className="text-sm">
          {valueFormatter(data.value)} ({data.percent ? (data.percent * 100).toFixed(1) : 0}%)
        </p>
      </div>
    );
  }
  return null;
};

export function PieChart({
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#d946ef'
  ],
  height = 300,
  innerRadius = '60%',
  outerRadius = '90%',
  showLegend = true,
  showLabel = false,
  labelFormatter = null,
  tooltipValueFormatter = (value) => value,
  ...props
}) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Filter out zero values for better visualization
    const filteredData = data.filter(item => item[dataKey] > 0);
    
    // If all values are zero, show a single 'No Data' slice
    if (filteredData.length === 0) {
      return [{ [nameKey]: 'No Data', [dataKey]: 1, color: '#e5e7eb' }];
    }
    
    return filteredData;
  }, [data, dataKey, nameKey]);

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
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey={dataKey}
            nameKey={nameKey}
            label={showLabel ? (labelFormatter || renderCustomizedLabel) : false}
            labelLine={false}
            {...props}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || colors[index % colors.length]} 
                stroke="#ffffff"
              />
            ))}
          </Pie>
          <Tooltip 
            content={
              <CustomTooltip 
                valueFormatter={tooltipValueFormatter}
              />
            } 
          />
          {showLegend && (
            <Legend 
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value, entry, index) => {
                const data = chartData[index];
                const percentage = data.percent ? (data.percent * 100).toFixed(1) : 0;
                return (
                  <span className="text-gray-700">
                    {value}: {tooltipValueFormatter(data[dataKey])} ({percentage}%)
                  </span>
                );
              }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
