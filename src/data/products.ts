import { Product } from '../types';

export const products: Product[] = [
  {
    id: '1',
    name: 'Hydrating Shampoo',
    description: 'Luxurious hydrating shampoo for dry and damaged hair. Infused with argan oil and keratin to restore moisture and shine.',
    price: 249.99,
    image: '/imagescon/shampoo.JPG',
    category: 'hair',
  },
  {
    id: '2',
    name: 'Nourishing Conditioner',
    description: 'Rich, nourishing conditioner that repairs and strengthens hair. Contains vitamin E and shea butter for ultimate hydration.',
    price: 269.99,
    image: '/imagescon/shampoo.JPG',
    category: 'hair',
  },
  {
    id: '3',
    name: 'Heat Protection Spray',
    description: 'Protect your hair from heat damage with this lightweight spray. Works for blow-drying, straightening, and curling.',
    price: 189.99,
    image: '/imagescon/heat-protectant.jpg',
    category: 'hair',
  },
  {
    id: '4',
    name: 'Facial Moisturizer',
    description: 'Lightweight daily moisturizer suitable for all skin types. Provides 24-hour hydration and creates a smooth base for makeup.',
    price: 329.99,
    image: '/imagescon/moisturizer.jpg',
    category: 'skin',
  },
  {
    id: '5',
    name: 'Vitamin C Serum',
    description: 'Powerful antioxidant serum that brightens skin tone, reduces fine lines, and protects against environmental damage.',
    price: 429.99,
    image: '/imagescon/vit-c.jpg',
    category: 'skin',
  },


];

export const getProductById = (id: string): Product | undefined => {
  return products.find(product => product.id === id);
};

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter(product => product.category === category);
};