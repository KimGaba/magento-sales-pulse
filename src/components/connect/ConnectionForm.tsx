
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';

// Schema for connection form
const connectionFormSchema = z.object({
  storeName: z.string().min(2, "Butiksnavn skal være mindst 2 tegn"),
  url: z.string().url("Indtast en gyldig URL").refine((val) => {
    return val.startsWith('http://') || val.startsWith('https://');
  }, "URL skal starte med http:// eller https://"),
  apiKey: z.string().min(5, "API-nøglen er for kort")
});

type ConnectionFormValues = z.infer<typeof connectionFormSchema>;

interface ConnectionFormProps {
  onSubmit: (values: ConnectionFormValues) => void;
  connecting: boolean;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onSubmit, connecting }) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      storeName: '',
      url: '',
      apiKey: ''
    }
  });

  const handleSubmit = (values: ConnectionFormValues) => {
    // We're no longer collecting order statuses
    onSubmit(values);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Butiksnavn</FormLabel>
                  <FormControl>
                    <Input placeholder="Min Magento-butik" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Magento API URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://minbutik.dk" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Magento API-nøgle</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="API-nøgle / access token" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={connecting}>
                {connecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Forbinder...
                  </>
                ) : (
                  "Forbind butik"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ConnectionForm;
