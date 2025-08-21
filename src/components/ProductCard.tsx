import { useState } from 'react';
import { formatPrice } from '../lib/utils';
import { Product } from '../types';
import { Button } from './ui/Button';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from './ui/Toaster';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem } = useCart();
  
  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      type: 'product',
      image: product.image,
    });
    
    toast('Added to cart successfully!', 'success');
  };
  
  return (
    <div 
      className="card group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden h-64">
        <img 
          src={product.image} 
          alt={product.name} 
          className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
        />
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-lg">{product.name}</h3>
          <p className="font-semibold text-primary-600">{formatPrice(product.price)}</p>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
        
        <Button 
          variant="primary" 
          fullWidth
          leftIcon={<ShoppingBag className="w-4 h-4" />}
          onClick={handleAddToCart}
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
}