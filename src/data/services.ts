import { Service } from '../types';

export const services: Service[] = [
  {
    id: '1',
    name: 'Eyelash Extensions',
    description: `Transforma tu mirada con nuestras extensiones de pestañas premium. Nuestras técnicas certificadas aplican cuidadosamente pestañas sintéticas individuales para realzar tu belleza natural, creando un efecto impresionante y duradero perfecto para cualquier ocasión.`,
    price: 1200,
    duration: 120,
    image: '/imagescon/lash.jpg',
    category: 'lashes',
  },
  {
    id: '2',
    name: 'Professional Makeup',
    description: `Deja que nuestros expertos maquilladores realcen tu belleza natural. Ya sea para un evento especial, una sesión de fotos o simplemente porque sí, crearemos un look impecable adaptado a tus rasgos y preferencias utilizando productos de alta gama.`,
    price: 850,
    duration: 120,
    image: '/imagescon/model-ivon.jpg',
    category: 'makeup',
  },
  {
    id: '3',
    name: 'Luxury Manicure',
    description: `Consiente tus manos con nuestro servicio de manicura exclusivo. Incluye modelado de uñas, cuidado de cutículas, masaje de manos y aplicación de esmalte premium. Opción de esmalte en gel disponible para resultados más duraderos.`,
    price: 450,
    duration: 120,
    image: '/imagescon/manicure.JPG',
    category: 'nails',
  },
  {
    id: '4',
    name: 'Deluxe Pedicure',
    description: `Revitaliza tus pies con nuestro tratamiento de pedicura de lujo. Incluye baño de pies, exfoliación, eliminación de callosidades, cuidado de uñas, masaje relajante de pies y aplicación de esmalte premium.`,
    price: 550,
    duration: 120,
    image: '/imagescon/pedicure.JPG',
    category: 'nails',
  },
  {
    id: '5',
    name: 'Special Occasion Bundle',
    description: `Haz que tu día especial sea aún más memorable con nuestro paquete de belleza integral. Incluye maquillaje profesional, extensiones de pestañas y tu elección de manicura o pedicura a un precio especial de paquete.`,
    price: 2200,
    duration: 240,
    image: '/imagescon/wedding.JPG',
    category: 'bundle',
    isComingSoon: true,
  },
  {
    id: '6',
    name: 'Spa Treatment Experience',
    description: `Disfruta de nuestros servicios integrales de spa. Elige entre tratamientos específicos para áreas localizadas o disfruta de una experiencia completa que incluye masaje, aromaterapia y terapia de tejido profundo.`,
    price: 1800,
    duration: 120,
    image: '/imagescon/summersuit.JPG',
    category: 'spa',
    isComingSoon: true,
  },
];

export const getServiceById = (id: string): Service | undefined => {
  return services.find(service => service.id === id);
};

export const getServicesByCategory = (category: string): Service[] => {
  return services.filter(service => service.category === category);
};

export const getAvailableServices = (): Service[] => {
  return services.filter(service => !service.isComingSoon);
};

export const getComingSoonServices = (): Service[] => {
  return services.filter(service => service.isComingSoon);
};