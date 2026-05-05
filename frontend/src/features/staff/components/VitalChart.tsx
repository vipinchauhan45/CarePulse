import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { VitalDataPoint } from '@/types';

interface VitalChartProps {
  title: string;
  data: VitalDataPoint[];
  dataKey: keyof VitalDataPoint;
  color: string;
  unit: string;
  domain?: [number, number];
}

const VitalChart: React.FC<VitalChartProps> = ({
  title,
  data,
  dataKey,
  color,
  unit,
  domain,
}) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Waiting for data...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--chart-grid))" 
                  vertical={false}
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTime}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={50}
                />
                <YAxis
                  domain={domain || ['auto', 'auto']}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelFormatter={formatTime}
                  formatter={(value: number) => [`${value} ${unit}`, title]}
                />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: color }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VitalChart;
