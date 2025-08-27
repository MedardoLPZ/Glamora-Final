export type Service2 = {
    id: string;
    name: string;
    price: number;
    durationMin: number;
    category?: string;
    photo?: string;
    description?: string;
  };
  
  export const initialServices: Service2[] = [
    {
      id: "srv1",
      name: "Manicure",
      price: 180,
      durationMin: 90,
      category: "Nails",
      photo: "/imagescon/manicure.jpg",
    },
    {
      id: "srv2",
      name: "Pedicure",
      price: 150,
      durationMin: 60,
      category: "Nails",
      photo: "/imagescon/manicure.jpg",
    },
  ];