
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TestRunnerProps {
  isRunning: boolean;
  onRunAllTests: () => void;
  onCheckTableExistence: () => void;
  supabaseInfo: string;
}

const TestRunner = ({ isRunning, onRunAllTests, onCheckTableExistence, supabaseInfo }: TestRunnerProps) => {
  const handleCreateProject = () => {
    window.open('https://supabase.com/dashboard/projects', '_blank');
    toast({
      title: "Opening Supabase Dashboard",
      description: "After creating a new project, update the credentials in your application",
    });
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Database Connection Tests</CardTitle>
        <CardDescription>Check if your Supabase database connection is working properly</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 mb-4 border rounded-md bg-amber-50 border-amber-200">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-700">Connection Information</h4>
              <p className="text-sm text-amber-600 mt-1">{supabaseInfo}</p>
              <p className="text-sm text-amber-600 mt-1">
                If you're experiencing 401 or 404 errors, your Supabase project may be inactive or the tables may not exist.
                Consider creating a new Supabase project and updating the credentials.
              </p>
            </div>
          </div>
        </div>

        <p className="mb-4">This will run several tests against your Supabase database to verify connectivity and access to the transactions table.</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onRunAllTests} disabled={isRunning} className="flex items-center">
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run All Tests'
            )}
          </Button>
          <Button 
            onClick={onCheckTableExistence} 
            disabled={isRunning}
            variant="outline"
          >
            Check Table Existence
          </Button>
          <Button 
            variant="outline"
            onClick={handleCreateProject}
            className="flex items-center"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Create New Supabase Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestRunner;
