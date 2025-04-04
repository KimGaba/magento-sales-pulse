
import React, { ReactElement } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer } from 'recharts';

interface ChartCardProps {
  title: string;
  description: string;
  children: ReactElement;
  height?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  children,
  height = "h-80"
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className={height}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ChartCard;
