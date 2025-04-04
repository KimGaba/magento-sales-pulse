
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer } from 'recharts';

interface ChartCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
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
          {/* Ensure children is a ReactElement by using React.Children.only or simply casting */}
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ChartCard;
