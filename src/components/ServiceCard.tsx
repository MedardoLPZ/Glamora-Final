import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/utils';
import { Service } from '../types';
import { Button } from './ui/Button';
import { Clock } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`card group transition-all duration-500 ${service.isComingSoon ? 'opacity-85' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden h-60">
        <img 
          src={service.image} 
          alt={service.name} 
          className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
        />
        
        {service.isComingSoon && (
          <div className="absolute top-4 right-4 bg-accent-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Coming Soon
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent flex items-end">
          <div className="p-6 w-full">
            <h3 className="text-white font-medium text-xl mb-1">{service.name}</h3>
            <div className="flex justify-between items-center">
              <p className="text-white font-semibold">{formatPrice(service.price)}</p>
              <div className="flex items-center text-white text-sm">
                <Clock className="w-4 h-4 mr-1" />
                <span>{service.duration} min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>
        
        {service.isComingSoon ? (
          <Button 
            variant="outline" 
            fullWidth
            disabled
          >
            Coming Soon
          </Button>
        ) : (
          <Link to={`/book?service=${service.id}`}>
            <Button 
              variant="primary" 
              fullWidth
            >
              Book Now
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}