'use client'

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

type HourlySalesData = {
  hour: string;
  revenue: number;
};

type PieData = {
  name: string;
  value: number;
};

interface AnalyticsChartsProps {
  hourlySalesData: HourlySalesData[];
  pieData: PieData[];
  totalSales: number;
  totalCost: number;
  grossMargin: number;
}

export default function AnalyticsCharts({
  hourlySalesData,
  pieData,
  totalSales,
  totalCost,
  grossMargin
}: AnalyticsChartsProps) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <>
      {/* Sales by Time/Hour */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlySalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" name="Revenue" fill="#06b6d4" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gross Margin */}
      <div className="flex items-center justify-center h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-center">
        <p className="text-lg font-semibold">Gross Margin: {grossMargin.toFixed(2)}%</p>
        <p className="text-sm text-muted-foreground">
          Total Sales: ${totalSales.toFixed(2)} | Total Cost: ${totalCost.toFixed(2)}
        </p>
      </div>
    </>
  );
} 
