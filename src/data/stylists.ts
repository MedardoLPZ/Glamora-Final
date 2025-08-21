import { Stylist } from '../types';

export const stylists: Stylist[] = [
  {
    id: '1',
    name: 'Angie ',
    specialty: 'Lashista | Makeup Artist ', 
    avatar: '/imagescon/bebo.jpg',
    bio: 'Angie es experta en extensiones de pestañas y diseño de mirada. Su técnica precisa y su pasión por el detalle logran acabados naturales o dramáticos según el estilo de cada clienta, garantizando comodidad y larga duración.',
  },
  {
    id: '2',
    name: 'Katy',
    specialty: 'Manicurista',
    avatar: '/imagescon/katy.jpg',
    bio: 'Katy domina el arte del manicure y pedicure profesional. Especialista en tendencias modernas como uñas acrílicas, gel y nail art creativo, ofrece un servicio que combina estilo, salud y elegancia en cada aplicación.',
  },
  {
    id: '3',
    name: 'Naty',
    specialty: 'Nail Technician & Hair',
    avatar: '/imagescon/naty.JPG',
    bio: 'Naty se distingue por su dedicación al cuidado integral de las uñas. Experta en tratamientos fortalecedores, esmalte semipermanente y diseños personalizados, brinda a cada clienta una experiencia de belleza única y relajante.',
  },
 
];

export const getStylistById = (id: string): Stylist | undefined => {
  return stylists.find(stylist => stylist.id === id);
};

export const getStylistsBySpecialty = (specialty: string): Stylist[] => {
  return stylists.filter(stylist => stylist.specialty.toLowerCase().includes(specialty.toLowerCase()));
};