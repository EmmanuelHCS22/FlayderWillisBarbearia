export const DEFAULT_SERVICES = [
  {
    id: 'corte',
    name: 'Corte',
    description: 'Corte moderno, clássico ou degradê com acabamento impecável na lâmina e alinhamento.',
    price: 40,
    duration: 45,
    active: true,
    highlight: false,
    iconName: 'scissors'
  },
  {
    id: 'barba',
    name: 'Barba',
    description: 'Modelagem completa com toalha quente, hidratação profunda de fios e lâmina descartável.',
    price: 30,
    duration: 40,
    active: true,
    highlight: false,
    iconName: 'beard'
  },
  {
    id: 'corte-barba',
    name: 'Corte + Barba',
    description: 'A experiência completa: corte de cabelo alinhado e barba com tratamento térmico e hidratação.',
    price: 60,
    duration: 60,
    active: true,
    highlight: true,
    highlightText: 'COMBO — ECONOMIZE',
    iconName: 'combo'
  },
  {
    id: 'selagem',
    name: 'Selagem',
    description: 'Redução de volume e controle de frizz com brilho espelhado e fios alinhados por mais tempo.',
    price: 80,
    duration: 90,
    active: true,
    highlight: false,
    iconName: 'hair'
  },
  {
    id: 'alisamento',
    name: 'Alisamento',
    description: 'Tratamento térmico de alto alinhamento para fios lisos, macios e maleáveis.',
    price: 100,
    duration: 120,
    active: true,
    highlight: false,
    iconName: 'straight'
  },
  {
    id: 'platinado',
    name: 'Platinado',
    description: 'Descoloração global com tonalização cinza/branco frio premium e tratamento capilar anti-danos.',
    price: 150,
    duration: 180,
    active: true,
    highlight: false,
    iconName: 'platinum'
  },
  {
    id: 'sobrancelha',
    name: 'Sobrancelha',
    description: 'Design e alinhamento masculino na navalha e pinça para valorizar o olhar com naturalidade.',
    price: 20,
    duration: 20,
    active: true,
    highlight: false,
    iconName: 'eyebrow'
  },
  {
    id: 'pintura',
    name: 'Pintura',
    description: 'Camuflagem de fios brancos ou pigmentação capilar/barba de tom uniforme e discreto.',
    price: 70,
    duration: 60,
    active: true,
    highlight: false,
    iconName: 'dye'
  }
];

export const CAROUSEL_IMAGES = [
  'https://i.imgur.com/qKt59kb.png',
  'https://i.imgur.com/91tjeYd.png',
  'https://i.imgur.com/4kHpeCy.png',
  'https://i.imgur.com/h2nBHm8.png',
  'https://i.imgur.com/2wSbM3U.png',
  'https://i.imgur.com/lMUxF6J.png',
  'https://i.imgur.com/nxJuhDv.png',
  'https://i.imgur.com/0T1naIo.png',
  'https://i.imgur.com/SzUN8S7.png',
  'https://i.imgur.com/acNiKqW.png',
  'https://i.imgur.com/ocx7YvN.png'
];

export const LOGO_URL = 'https://i.imgur.com/g2Q8VMo.png';
export const WHATSAPP_URL = 'https://wa.link/h86l37';
export const INSTAGRAM_URL = 'https://www.instagram.com/flayderwillisbarbearia?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==';

// Base time slots defined in requirements:
// 08:00, 08:45, 09:30, 10:15, 11:00, 11:45, 12:30, 13:15, 14:00, 14:45, 15:30, 16:15, 17:00, 17:45, 18:30, 19:15
export const BASE_TIME_SLOTS = [
  '08:00',
  '08:45',
  '09:30',
  '10:15',
  '11:00',
  '11:45',
  '12:30',
  '13:15',
  '14:00',
  '14:45',
  '15:30',
  '16:15',
  '17:00',
  '17:45',
  '18:30',
  '19:15'
];

export const CLOSING_TIME_MINUTES = 19 * 60 + 30; // 19:30 = 1170 minutes
export const OPENING_TIME_MINUTES = 8 * 60; // 08:00 = 480 minutes
