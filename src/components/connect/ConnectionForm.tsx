
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription
} from "@/components/ui/form";
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

interface ConnectionFormValues {
  storeName: string;
  url: string;
  apiKey: string;
  orderStatuses: Record<string, boolean>;
}

interface ConnectionFormProps {
  onSubmit: (values: ConnectionFormValues) => void;
  connecting: boolean;
  defaultOrderStatuses: Record<string, boolean>;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ 
  onSubmit, 
  connecting,
  defaultOrderStatuses
}) => {
  const form = useForm<ConnectionFormValues>({
    defaultValues: {
      storeName: '',
      url: '',
      apiKey: '',
      orderStatuses: defaultOrderStatuses
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forbind til Magento</CardTitle>
        <CardDescription>
          Indtast din Magento butiksadresse og API-nøgle
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Butiksnavn</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Min Butik"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Et navn til at identificere din butik i systemet
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Magento URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://dinbutik.dk"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    F.eks. https://dinbutik.dk
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>API-nøgle</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Din Magento API-nøgle"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    <Link to="/magento-api-help" className="text-magento-600 hover:underline flex items-center">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Hvor finder jeg min API-nøgle?
                    </Link>
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <div className="space-y-3 pt-2">
              <div className="text-sm font-medium">Synkroniser ordrer med status</div>
              <div className="text-xs text-gray-500 mb-2">
                Vælg hvilke ordre-statusser der skal synkroniseres fra Magento
              </div>
              
              {Object.entries(defaultOrderStatuses).map(([status, defaultValue]) => (
                <FormField
                  key={status}
                  control={form.control}
                  name={`orderStatuses.${status}` as any}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm capitalize">
                          {status}
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit"
              className="w-full bg-magento-600 hover:bg-magento-700"
              disabled={connecting}
            >
              {connecting ? "Forbinder..." : "Forbind butik"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default ConnectionForm;
