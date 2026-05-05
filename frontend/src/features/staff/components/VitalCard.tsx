import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VitalCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  color: 'heart' | 'oxygen' | 'temp' | 'pressure' | 'respiratory';
  isLive?: boolean;
}

const colorClasses = {
  heart: {
    bg: 'bg-vital-heart/10',
    text: 'text-vital-heart',
    glow: 'vital-glow-heart',
  },
  oxygen: {
    bg: 'bg-vital-oxygen/10',
    text: 'text-vital-oxygen',
    glow: 'vital-glow-oxygen',
  },
  temp: {
    bg: 'bg-vital-temp/10',
    text: 'text-vital-temp',
    glow: 'vital-glow-temp',
  },
  pressure: {
    bg: 'bg-vital-pressure/10',
    text: 'text-vital-pressure',
    glow: 'vital-glow-pressure',
  },
  respiratory: {
    bg: 'bg-success/10',
    text: 'text-success',
    glow: '',
  },
};

const VitalCard: React.FC<VitalCardProps> = ({
  label,
  value,
  unit,
  icon: Icon,
  color,
  isLive = false,
}) => {
  const classes = colorClasses[color];

  return (
    <Card className={cn(
      'border-border transition-all duration-300',
      isLive && classes.glow
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={cn('p-2 rounded-lg', classes.bg)}>
            <Icon className={cn('h-4 w-4', classes.text)} />
          </div>
          {isLive && (
            <span className={cn(
              'h-2 w-2 rounded-full animate-pulse-live',
              color === 'heart' ? 'bg-vital-heart' :
              color === 'oxygen' ? 'bg-vital-oxygen' :
              color === 'temp' ? 'bg-vital-temp' :
              color === 'pressure' ? 'bg-vital-pressure' :
              'bg-success'
            )} />
          )}
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className={cn(
            'text-2xl font-bold font-mono tabular-nums',
            classes.text
          )}>
            {value}
          </span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default VitalCard;
