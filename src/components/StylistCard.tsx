import { useState } from 'react';
import { Stylist } from '../types';

interface StylistCardProps {
  stylist: Stylist;
  isSelected?: boolean;
  onClick?: () => void;
}

export function StylistCard({ stylist, isSelected = false, onClick }: StylistCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`card transition-all duration-300 cursor-pointer ${
        isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''
      } ${
        isHovered && !isSelected ? 'shadow-soft-lg transform -translate-y-1' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative overflow-hidden h-64">
        <img 
          src={stylist.avatar} 
          alt={stylist.name} 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-6">
        <h3 className="font-medium text-lg mb-1">{stylist.name}</h3>
        <p className="text-primary-600 font-medium text-sm mb-3">{stylist.specialty}</p>
        <p className="text-gray-600 text-sm line-clamp-3">{stylist.bio}</p>
      </div>
    </div>
  );
}