// src/components/arena/ActivityChart.tsx
// Weekly activity bar chart for the last 12 weeks

import { useMemo } from "react";
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";
import { EloTier, getEloFrameStyles } from "@/lib/arena/eloUtils";

interface WeeklyActivity {
  weekStart: string; // ISO date
  workoutsCount: number;
  totalMinutes: number;
}

interface ActivityChartProps {
  data: WeeklyActivity[];
  eloTier: EloTier;
}

const ActivityChart = ({ data, eloTier }: ActivityChartProps) => {
  const eloStyles = getEloFrameStyles(eloTier);
  
  // Ensure we have 12 weeks of data, padding with zeros if needed
  const chartData = useMemo(() => {
    const weeks: { week: number; count: number }[] = [];
    
    // Last 12 weeks including current
    for (let i = 11; i >= 0; i--) {
      const weekData = data[data.length - 1 - i];
      weeks.push({
        week: i,
        count: weekData?.workoutsCount || 0,
      });
    }
    
    return weeks.reverse();
  }, [data]);

  const maxCount = Math.max(...chartData.map(d => d.count), 1);
  
  // Calculate this week's total
  const thisWeekMinutes = data[data.length - 1]?.totalMinutes || 0;
  const thisWeekHours = Math.floor(thisWeekMinutes / 60);
  const thisWeekMins = thisWeekMinutes % 60;
  
  const timeLabel = thisWeekHours > 0 
    ? `${thisWeekHours}h ${thisWeekMins}min`
    : `${thisWeekMins} min`;

  return (
    <div className="card-glass rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-foreground">
          Atividade
        </span>
        <span className="text-xs text-muted-foreground">
          {timeLabel} esta semana
        </span>
      </div>
      
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="15%">
            <Bar 
              dataKey="count" 
              radius={[2, 2, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.count > 0 ? eloStyles.borderColor : 'hsl(var(--muted))'}
                  opacity={index === chartData.length - 1 ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>12 sem atrás</span>
        <span>Esta semana</span>
      </div>
    </div>
  );
};

export default ActivityChart;
