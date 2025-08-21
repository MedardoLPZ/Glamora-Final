import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { ServiceCard } from '../components/ServiceCard';
import { StylistCard } from '../components/StylistCard';
import { Service, Stylist } from '../types';
import { getAvailableServices } from '../data/services';
import { stylists } from '../data/stylists';
import { Calendar, Sparkles, Heart, Users } from 'lucide-react';

export default function Home() {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [featuredStylists, setFeaturedStylists] = useState<Stylist[]>([]);

  useEffect(() => {
    // Get a subset of services for the homepage
    const services = getAvailableServices();
    setFeaturedServices(services.slice(0, 3));
    
    // Get a subset of stylists for the homepage
    setFeaturedStylists(stylists.slice(0, 3));
  }, []);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/3992880/pexels-photo-3992880.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Glamora Studio Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        </div>
        
        <div className="container relative z-10 text-white">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-heading font-semibold mb-4 animate-slide-up">
              Glow with Glamora
            </h1>
            <p className="text-xl md:text-2xl mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Where Beauty Meets Passion
            </p>
            <p className="text-lg text-gray-200 mb-10 max-w-xl animate-slide-up" style={{ animationDelay: '0.3s' }}>
              Discover our premium beauty services designed to enhance your natural beauty and provide a relaxing, luxurious experience.
            </p>
            <div className="flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Link to="/book">
                <Button size="lg">
                  Book an Appointment
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="outline" size="lg">
                  Explore Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Services Preview Section */}
      <section className="section bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="mb-4">Our Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We offer a wide range of beauty and wellness services designed to help you look and feel your best. Each service is delivered by our highly trained professionals using premium products.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/services">
              <Button variant="outline" size="lg">
                View All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="section bg-gray-50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="mb-4">Why Choose Glamora</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              At Glamora Studio, we are committed to excellence in every aspect of our service, creating an exceptional experience for each client.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-soft text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-medium mb-3">Premium Experience</h3>
              <p className="text-gray-600">
                Enjoy a luxurious atmosphere and exceptional service during every visit.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-soft text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-medium mb-3">Expert Stylists</h3>
              <p className="text-gray-600">
                Our team consists of highly trained professionals with years of experience.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-soft text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-medium mb-3">Quality Products</h3>
              <p className="text-gray-600">
                We use only premium products that are gentle on you and the environment.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-soft text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-medium mb-3">Easy Booking</h3>
              <p className="text-gray-600">
                Book your appointments online anytime, anywhere with our convenient system.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Stylists Section */}
      <section className="section bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="mb-4">Meet Our Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our talented team of beauty professionals is dedicated to helping you look and feel your best. Each stylist brings unique skills and expertise to Glamora Studio.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredStylists.map((stylist) => (
              <StylistCard key={stylist.id} stylist={stylist} />
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary-500 text-white">
        <div className="container text-center">
          <h2 className="mb-6 text-white">Ready to Experience Glamora?</h2>
          <p className="text-primary-100 max-w-2xl mx-auto mb-10">
            Book your appointment today and discover why our clients keep coming back. Experience the perfect blend of relaxation and beautification at Glamora Studio.
          </p>
          <Link to="/book">
            <Button variant="secondary" size="lg">
              Book an Appointment Now
            </Button>
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}