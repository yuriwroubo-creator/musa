export type Product = {
  id: string;
  store: string;
  name: string;
  price: string;
  rating: string;
  category: string;
  img: string;
  media_urls?: string[];
};

export type Service = {
  id: string;
  name: string;
  title: string;
  price: string;
  home: boolean;
  rating: string;
  category: string;
  img: string;
  media_urls?: string[];
};

export type Vendor = {
  id: string;
  name: string;
  cat: string;
  img?: string;
};

export const productCategories = [
  "Todos",
  "Roupas",
  "Cabelos & Laces",
  "Maquilhagem",
  "Lingerie",
  "Doces & Catering",
  "Bebidas Artesanais",
  "Beats & Áudio",
  "Design & Arte",
  "Promoções",
];

export const serviceCategories = [
  "Todos",
  "Cabelo",
  "Maquilhagem",
  "Unhas",
  "Spa em Casa",
  "Fotografia",
  "Videografia",
  "Design",
  "Produção Musical",
];
