import prod1 from "@/assets/prod-1.jpg";
import prod2 from "@/assets/prod-2.jpg";
import prod3 from "@/assets/prod-3.jpg";
import prod4 from "@/assets/prod-4.jpg";
import prod5 from "@/assets/prod-5.jpg";
import prod6 from "@/assets/prod-6.jpg";
import reel1 from "@/assets/reel-1.jpg";
import reel2 from "@/assets/reel-2.jpg";
import reel3 from "@/assets/reel-3.jpg";

export type MusaKind = "produto" | "servico";

export type MusaItem = {
  id: string;
  title: string;
  price: number;
  image: string;
  kind: MusaKind;
  category: string;
  storeId: string;
  storeName: string;
  location: string;
  whatsapp: string;
  rating: number;
  sales: number;
  premium?: boolean;
};

export type MusaReel = {
  id: string;
  image: string;
  caption: string;
  storeId: string;
  storeName: string;
  handle: string;
  itemTitle: string;
  price: number;
  likes: number;
  comments: number;
  whatsapp: string;
};

export const categories = [
  "Tudo",
  "Maquilhagem",
  "Cabelo",
  "Perfumes",
  "Moda",
  "Acessórios",
  "Unhas",
] as const;

export const items: MusaItem[] = [
  {
    id: "p1",
    title: "Perfume Noite de Luanda 100ml",
    price: 42500,
    image: prod1,
    kind: "produto",
    category: "Perfumes",
    storeId: "s1",
    storeName: "Casa Bela",
    location: "Talatona, Luanda",
    whatsapp: "244923000001",
    rating: 4.9,
    sales: 214,
    premium: true,
  },
  {
    id: "p2",
    title: "Óleo Capilar Crespo Nutrição",
    price: 9800,
    image: prod2,
    kind: "produto",
    category: "Cabelo",
    storeId: "s2",
    storeName: "Kianda Hair",
    location: "Maianga, Luanda",
    whatsapp: "244923000002",
    rating: 4.7,
    sales: 431,
  },
  {
    id: "p3",
    title: "Mala Artesanal Missangas",
    price: 27000,
    image: prod3,
    kind: "produto",
    category: "Moda",
    storeId: "s3",
    storeName: "Ndalu Atelier",
    location: "Ilha, Luanda",
    whatsapp: "244923000003",
    rating: 5,
    sales: 87,
    premium: true,
  },
  {
    id: "p4",
    title: "Trio Batons Matte Rosa",
    price: 15500,
    image: prod4,
    kind: "produto",
    category: "Maquilhagem",
    storeId: "s1",
    storeName: "Casa Bela",
    location: "Talatona, Luanda",
    whatsapp: "244923000001",
    rating: 4.8,
    sales: 302,
  },
  {
    id: "p5",
    title: "Tranças Box Braids — sessão",
    price: 18000,
    image: prod5,
    kind: "servico",
    category: "Cabelo",
    storeId: "s2",
    storeName: "Kianda Hair",
    location: "Maianga, Luanda",
    whatsapp: "244923000002",
    rating: 4.9,
    sales: 156,
  },
  {
    id: "p6",
    title: "Conjunto Dourado Missanga",
    price: 12300,
    image: prod6,
    kind: "produto",
    category: "Acessórios",
    storeId: "s3",
    storeName: "Ndalu Atelier",
    location: "Ilha, Luanda",
    whatsapp: "244923000003",
    rating: 4.6,
    sales: 64,
  },
];

export const reels: MusaReel[] = [
  {
    id: "r1",
    image: reel1,
    caption:
      "Batom matte que aguenta o calor de Luanda o dia inteiro 💋 #musa #beleza",
    storeId: "s1",
    storeName: "Casa Bela",
    handle: "@casabela",
    itemTitle: "Trio Batons Matte Rosa",
    price: 15500,
    likes: 3421,
    comments: 128,
    whatsapp: "244923000001",
  },
  {
    id: "r2",
    image: reel2,
    caption: "Vestido em pano africano feito à medida no nosso atelier ✨",
    storeId: "s3",
    storeName: "Ndalu Atelier",
    handle: "@ndaluatelier",
    itemTitle: "Vestido Capulana Midi",
    price: 34000,
    likes: 8712,
    comments: 402,
    whatsapp: "244923000003",
  },
  {
    id: "r3",
    image: reel3,
    caption: "Nail art dourada — marcações abertas para esta semana 💅",
    storeId: "s2",
    storeName: "Kianda Hair",
    handle: "@kiandahair",
    itemTitle: "Nail Art Premium",
    price: 8500,
    likes: 1543,
    comments: 76,
    whatsapp: "244923000002",
  },
];

export const stores = [
  {
    id: "s1",
    name: "Casa Bela",
    handle: "@casabela",
    bio: "Perfumaria e maquilhagem premium em Talatona. Entregas em toda a Luanda.",
    followers: 4820,
  },
  {
    id: "s2",
    name: "Kianda Hair",
    handle: "@kiandahair",
    bio: "Cabelo, unhas e cuidado natural. Marcações por WhatsApp.",
    followers: 9310,
  },
  {
    id: "s3",
    name: "Ndalu Atelier",
    handle: "@ndaluatelier",
    bio: "Moda autoral angolana feita à mão, peça por peça.",
    followers: 2604,
  },
];

export function formatKz(value: number) {
  return `${new Intl.NumberFormat("pt-PT").format(value)} Kz`;
}

export function whatsappLink(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
