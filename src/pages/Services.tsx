import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { ServiceCard } from '../components/ServiceCard';
import { Service } from '../types';
import { getAvailableServices, getComingSoonServices } from '../data/services';

export default function Services() {
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [comingSoonServices, setComingSoonServices] = useState<Service[]>([]);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  
  useEffect(() => {
    const available = getAvailableServices();
    const comingSoon = getComingSoonServices();
    
    setAvailableServices(available);
    setComingSoonServices(comingSoon);
    setFilteredServices(available);
  }, []);
  
  useEffect(() => {
    if (categoryFilter === 'all') {
      setFilteredServices(availableServices);
    } else {
      setFilteredServices(
        availableServices.filter((service) => service.category === categoryFilter)
      );
    }
  }, [categoryFilter, availableServices]);
  
  // Get unique categories
  const categories = [
    'all',
    ...new Set(availableServices.map((service) => service.category)),
  ];
  
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-primary-50">
        <div className="container text-center">
          <h1 className="mb-4">Our Services</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From hair styling to skin treatments, explore our range of premium beauty services
            designed to enhance your natural beauty and provide a luxurious experience.
          </p>
        </div>
      </section>
      
      {/* Services Section */}
      <section className="section">
        <div className="container">
          {/* Category Filters */}
          <div className="mb-12 flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setCategoryFilter(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Available Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
          
          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No services found for this category.</p>
            </div>
          )}
          
          {/* Coming Soon Section */}
          {categoryFilter === 'all' && comingSoonServices.length > 0 && (
            <div className="mt-24">
              <h2 className="text-center mb-12">Coming Soon</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {comingSoonServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}