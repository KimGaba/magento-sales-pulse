
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChevronLeft, Key, Shield, Terminal } from 'lucide-react';

const MagentoApiHelp = () => {
  return (
    <Layout>
      <div className="mb-6">
        <Button variant="outline" asChild className="mb-4">
          <Link to="/connect" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Tilbage til forbindelser
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Sådan finder du din Magento API-nøgle</h1>
        <p className="text-gray-500">Følg denne guide for at generere en Admin REST API token til din Magento butik</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-magento-600" />
              Hvad er en Magento API-nøgle?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2">
              En Magento API-nøgle (også kaldet Access Token) er en unik sikkerhedsnøgle, der giver Sales Pulse adgang 
              til at hente data fra din Magento-butik via API'et.
            </p>
            <p>
              Nøglen er knyttet til en admin-bruger i din Magento-butik og giver kun de rettigheder, 
              som den pågældende bruger har.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5 text-magento-600" />
              Sådan genererer du en API-nøgle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md bg-gray-50 p-4">
                <h3 className="font-medium mb-2">Trin 1: Log ind i Magento Admin</h3>
                <p>Log ind på din Magento Admin side med en administrator-konto.</p>
              </div>
              
              <div className="rounded-md bg-gray-50 p-4">
                <h3 className="font-medium mb-2">Trin 2: Gå til System &gt; Integrations</h3>
                <p>
                  I admin-menuen, find og klik på "System" og derefter "Integrations". Dette punkt 
                  findes typisk i hovedmenuen eller under "System" sektionen.
                </p>
              </div>
              
              <div className="rounded-md bg-gray-50 p-4">
                <h3 className="font-medium mb-2">Trin 3: Opret en ny integration</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Klik på "Add New Integration" knappen</li>
                  <li>Udfyld følgende felter:
                    <ul className="list-disc pl-5 mt-1">
                      <li><strong>Name:</strong> Sales Pulse Integration</li>
                      <li><strong>Email:</strong> Din email-adresse</li>
                      <li><strong>Current Admin Password:</strong> Dit admin-password</li>
                    </ul>
                  </li>
                  <li>I fanen "API", vælg de ressourcer integrationen skal have adgang til, minimum:
                    <ul className="list-disc pl-5 mt-1">
                      <li>Sales &gt; Orders</li>
                      <li>Catalog &gt; Products</li>
                      <li>Customers &gt; Customer</li>
                    </ul>
                  </li>
                  <li>Alternativt kan du vælge "All" for at give fuld adgang</li>
                  <li>Klik på "Save" knappen</li>
                </ul>
              </div>
              
              <div className="rounded-md bg-gray-50 p-4">
                <h3 className="font-medium mb-2">Trin 4: Aktiver integrationen</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Efter at have gemt integrationen, vil Magento vise en oversigt over integrationen</li>
                  <li>Klik på "Activate" knappen</li>
                  <li>I pop-up vinduet, klik på "Allow"</li>
                </ul>
              </div>
              
              <div className="rounded-md bg-gray-50 p-4">
                <h3 className="font-medium mb-2">Trin 5: Kopiér Access Token</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Efter aktivering vises en side med forskellige tokens</li>
                  <li>Find "Access Token" feltet</li>
                  <li>Kopiér værdien i dette felt - dette er din API-nøgle</li>
                  <li>Indsæt denne værdi i "API-nøgle" feltet på Sales Pulse forbindelsessiden</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Terminal className="mr-2 h-5 w-5 text-magento-600" />
              Alternative metoder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              For Magento 2.4.x kan du også generere en API-nøgle via kommandolinjen:
            </p>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
              <code>
                bin/magento admin:token:create --user=&lt;admin_username&gt;
              </code>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Bemærk: Dette kræver SSH adgang til din Magento-server og skal udføres af en teknisk administrator.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-center pt-4">
          <Button asChild>
            <Link to="/connect" className="px-8">
              Tilbage til forbindelser
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default MagentoApiHelp;
