import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { RatingDataPoint } from '../types';

interface PerformanceChartProps {
  data: RatingDataPoint[];
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  if (data.length === 0) {
    return (
      <View className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm items-center justify-center">
        <Text className="text-slate-400 font-medium italic">No rating data available yet</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width - 32; // Account for padding
  const chartHeight = 200;
  const padding = 40;
  const chartWidth = screenWidth - padding * 2;

  // Calculate min and max ratings for scaling
  const ratings = data.map(d => d.rating);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const ratingRange = maxRating - minRating || 100; // Avoid division by zero

  // Calculate points for the line
  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
    const y = chartHeight - padding - ((point.rating - minRating) / ratingRange) * (chartHeight - padding * 2);
    return { x, y, rating: point.rating };
  });

  // Create SVG path
  const pathData = points.map((point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `L ${point.x} ${point.y}`;
  }).join(' ');

  return (
    <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <View style={{ height: chartHeight, width: screenWidth - 32 }}>
        {/* Y-axis labels */}
        <View style={{ position: 'absolute', left: 0, top: padding }}>
          <Text className="text-xs text-gray-600">{maxRating}</Text>
        </View>
        <View style={{ position: 'absolute', left: 0, bottom: padding }}>
          <Text className="text-xs text-gray-600">{minRating}</Text>
        </View>

        {/* Simple line chart using View components */}
        <View style={{ position: 'relative', height: chartHeight, width: screenWidth - 32 }}>
          {points.map((point, index) => (
            <View
              key={index}
              style={{
                position: 'absolute',
                left: point.x - 3,
                top: point.y - 3,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#3b82f6',
              }}
            />
          ))}
          
          {/* Connect points with lines */}
          {points.slice(0, -1).map((point, index) => {
            const nextPoint = points[index + 1];
            const width = Math.sqrt(
              Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
            );
            const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
            
            return (
              <View
                key={`line-${index}`}
                style={{
                  position: 'absolute',
                  left: point.x,
                  top: point.y,
                  width: width,
                  height: 2,
                  backgroundColor: '#3b82f6',
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: 'left center',
                }}
              />
            );
          })}
        </View>

        {/* X-axis label */}
        <View style={{ position: 'absolute', bottom: 10, left: screenWidth / 2 - 50 }}>
          <Text className="text-xs text-gray-600">Games Over Time</Text>
        </View>
      </View>
    </View>
  );
}
