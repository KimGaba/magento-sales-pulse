
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Database, BarChart, TrendingUp, Calendar } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/b987e83a-8258-4105-ad71-1cc75ec496f7.png" 
              alt="Logo" 
              className="h-12"
            />
          </div>
          <nav className="flex-1 flex justify-center">
            <ul className="flex space-x-8">
              <li><Link to="/dashboard" className="text-gray-600 hover:text-magento-600">Dashboard</Link></li>
              <li><Link to="/features" className="text-gray-600 hover:text-magento-600">Funktioner</Link></li>
              <li><Link to="/pricing" className="text-gray-600 hover:text-magento-600">Priser</Link></li>
            </ul>
          </nav>
          <div className="flex space-x-4">
            <Button asChild variant="outline"><Link to="/login">Log ind</Link></Button>
            <Button asChild><Link to="/login">Kom igang</Link></Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-white to-blue-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="md:w-1/2">
                <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                  Simpel Salgsindsigt til din Magento-butik
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Få overblik over din butiks præstation med et intuitivt dashboard – helt uden kompleksitet. 
                  Tilslut din Magento-butik på få minutter og få adgang til dine vigtigste salgsdata med det samme.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg" className="bg-magento-600 hover:bg-magento-700">
                    <Link to="/login">Forbind din butik</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/login">Se demo</Link>
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white shadow-xl rounded-lg p-6 border">
                  <img 
                    src="/placeholder.svg" 
                    alt="Dashboard preview" 
                    className="w-full h-auto rounded-md"
                    style={{ minHeight: '300px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Nøglefunktioner</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Alt du behøver for at holde øje med din butiks præstation, uden den sædvanlige kompleksitet.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg border transition-all hover:shadow-md">
                <div className="bg-magento-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Database className="text-magento-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nem integration</h3>
                <p className="text-gray-600">Forbind din Magento-butik på få minutter og start med at se dine data med det samme.</p>
              </div>

              <div className="bg-white p-6 rounded-lg border transition-all hover:shadow-md">
                <div className="bg-magento-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <BarChart className="text-magento-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Intuitivt dashboard</h3>
                <p className="text-gray-600">Et simpelt og overskueligt dashboard, der viser dine vigtigste salgsmetrikker.</p>
              </div>

              <div className="bg-white p-6 rounded-lg border transition-all hover:shadow-md">
                <div className="bg-magento-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <TrendingUp className="text-magento-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Salgstrends</h3>
                <p className="text-gray-600">Se udviklingen i dit salg over tid og spot trends, der påvirker din forretning.</p>
              </div>

              <div className="bg-white p-6 rounded-lg border transition-all hover:shadow-md">
                <div className="bg-magento-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Calendar className="text-magento-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Daglige overblik</h3>
                <p className="text-gray-600">Hold øje med daglige salgsresultater og reagér hurtigt på ændringer.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-magento-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Klar til at få indsigt i din butik?</h2>
              <p className="text-lg text-gray-600 mb-8">
                Slut med at rode med komplekse rapporter og uoverskuelige data. Få et klart overblik over din butik med Sales Pulse.
              </p>
              <Button asChild size="lg" className="bg-magento-600 hover:bg-magento-700">
                <Link to="/login">Start gratis prøveperiode</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-50 py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src="/lovable-uploads/b987e83a-8258-4105-ad71-1cc75ec496f7.png" 
                  alt="Logo" 
                  className="h-10"
                />
              </div>
              <p className="text-gray-600">
                Simpelt og intuitivt værktøj til at holde øje med din Magento-butiks præstation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links</h4>
              <ul className="space-y-2">
                <li><Link to="/features" className="text-gray-600 hover:text-magento-600">Funktioner</Link></li>
                <li><Link to="/pricing" className="text-gray-600 hover:text-magento-600">Priser</Link></li>
                <li><Link to="/support" className="text-gray-600 hover:text-magento-600">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontakt</h4>
              <p className="text-gray-600">
                kontakt@metricmate.dk<br />
                +45 12 34 56 78
              </p>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center">
            <p className="text-gray-600">© {new Date().getFullYear()} Alle rettigheder forbeholdes.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
