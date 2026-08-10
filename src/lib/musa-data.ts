import prodVestido from "@/assets/prod-vestido.jpg";
import prodLace from "@/assets/prod-lace.jpg";
import prodPaleta from "@/assets/prod-paleta.jpg";
import prodLingerie from "@/assets/prod-lingerie.jpg";
import prodBlazer from "@/assets/prod-blazer.jpg";
import prodPeruca from "@/assets/prod-peruca.jpg";
import svcMarcia from "@/assets/svc-marcia.jpg";
import svcNzinga from "@/assets/svc-nzinga.jpg";
import svcUnhas from "@/assets/svc-unhas.jpg";
import svcSpa from "@/assets/svc-spa.jpg";

export type Product = {
  id: string;
  store: string;
  name: string;
  price: string;
  rating: string;
  category: string;
  img: string;
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
};

export type Vendor = {
  id: string;
  name: string;
  cat: string;
  img: string;
};

export const productCategories = [
  "Todos",
  "Roupas",
  "Cabelos & Laces",
  "Maquilhagem",
  "Lingerie",
  "Promoções",
];

export const serviceCategories = [
  "Todos",
  "Cabelo",
  "Maquilhagem",
  "Unhas",
  "Spa em Casa",
];

export const products: Product[] = [
  {
    id: "p1",
    store: "Ana Reis Atelier",
    name: "Vestido Ankara Midi",
    price: "25.000 AOA",
    rating: "4.9",
    category: "Roupas",
    img: prodVestido,
  },
  {
    id: "p2",
    store: "Lace by Nuha",
    name: "Lace Frontal 13x4",
    price: "48.500 AOA",
    rating: "4.8",
    category: "Cabelos & Laces",
    img: prodLace,
  },
  {
    id: "p3",
    store: "Glow Studio LDA",
    name: "Paleta Sombras Nude",
    price: "14.900 AOA",
    rating: "5.0",
    category: "Maquilhagem",
    img: prodPaleta,
  },
  {
    id: "p4",
    store: "Bela Intimates",
    name: "Conjunto Lingerie Seda",
    price: "19.000 AOA",
    rating: "4.7",
    category: "Lingerie",
    img: prodLingerie,
  },
  {
    id: "p5",
    store: "Kianda Fashion",
    name: "Blazer Alfaiataria",
    price: "32.000 AOA",
    rating: "4.9",
    category: "Roupas",
    img: prodBlazer,
  },
  {
    id: "p6",
    store: "Zana Hair Co.",
    name: "Peruca Curly 100% Humano",
    price: "56.000 AOA",
    rating: "4.8",
    category: "Cabelos & Laces",
    img: prodPeruca,
  },
];

export const services: Service[] = [
  {
    id: "s1",
    name: "Márcia Domingos",
    title: "Tranças Boho + Extensões",
    price: "15.000 AOA / 2h",
    home: true,
    rating: "4.9",
    category: "Cabelo",
    img: svcMarcia,
  },
  {
    id: "s2",
    name: "Studio Nzinga",
    title: "Maquilhagem de Noiva",
    price: "35.000 AOA / 3h",
    home: false,
    rating: "5.0",
    category: "Maquilhagem",
    img: svcNzinga,
  },
  {
    id: "s3",
    name: "Bela Unhas Luanda",
    title: "Manicure em Gel Russo",
    price: "8.000 AOA / 1h",
    home: true,
    rating: "4.7",
    category: "Unhas",
    img: svcUnhas,
  },
  {
    id: "s4",
    name: "Rosa Spa em Casa",
    title: "Massagem Relaxante + Esfoliação",
    price: "22.000 AOA / 1h30",
    home: true,
    rating: "4.8",
    category: "Spa em Casa",
    img: svcSpa,
  },
];

export const vendors: Vendor[] = [
  { id: "v1", name: "Ana Reis Atelier", cat: "Moda Feminina", img: prodVestido },
  { id: "v2", name: "Zana Hair Co.", cat: "Cabelos & Laces", img: prodPeruca },
  { id: "v3", name: "Glow Studio LDA", cat: "Maquilhagem", img: svcNzinga },
  { id: "v4", name: "Bela Intimates", cat: "Lingerie", img: prodLingerie },
];
