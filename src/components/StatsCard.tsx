import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  colorVariant?: 'blue' | 'purple' | 'green' | 'orange';
}

export const StatsCard = ({ title, value, icon: Icon, description, colorVariant = 'blue' }: StatsCardProps) => {
  const gradientMap = {
    blue: 'bg-[image:var(--gradient-blue)]',
    purple: 'bg-[image:var(--gradient-purple)]',
    green: 'bg-[image:var(--gradient-green)]',
    orange: 'bg-[image:var(--gradient-orange)]',
  };

  const accentMap = {
    blue: 'bg-[hsl(var(--accent-blue))]',
    purple: 'bg-[hsl(var(--accent-purple))]',
    green: 'bg-[hsl(var(--accent-green))]',
    orange: 'bg-[hsl(var(--accent-orange))]',
  };

  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 ${gradientMap[colorVariant]}`}>
      <CardContent className="pt-6 relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-muted-foreground/80 uppercase tracking-wide">{title}</p>
          <div className={`p-2.5 rounded-xl ${accentMap[colorVariant]} shadow-md group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-3xl font-bold text-foreground">{value}</h3>
          {description && (
            <p className="text-xs text-muted-foreground/70 leading-relaxed">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
