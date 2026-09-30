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

export const DEFAULT_CAROUSEL_IMAGES = [
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
export const HEADER_BANNER_URL = 'https://i.imgur.com/RYZPqQd.jpeg';
export const WHATSAPP_URL = 'https://wa.link/h86l37';
export const WHATSAPP_PHONE_NUMBER = '553492504146';
export const INSTAGRAM_URL = 'https://www.instagram.com/flayderwillisbarbearia?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==';
export const GOOGLE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=ChIJiWS6ZJRDpJQRzo83bf_UkGc';

// Endereço exato da barbearia
export const BARBERSHOP_ADDRESS = 'R. Roberto Margonari, 827 - Luizote de Freitas, Uberlândia - MG, 38414-465';

// =========================================================================
// FOTO DA FACHADA DA BARBEARIA
// Cole aqui a URL ou o caminho da foto real da fachada da barbearia.
// Exemplo: 'https://i.imgur.com/sua_foto_da_fachada.jpg' ou '/fachada.jpg'
// Se deixado vazio (''), o componente exibirá um espaço preparado e elegante.
// =========================================================================
export const FACHADA_IMAGE_URL = '';

// Links de navegação dinâmica para Google Maps e Waze
const ENCODED_ADDRESS = encodeURIComponent(BARBERSHOP_ADDRESS);
export const GOOGLE_MAPS_NAV_URL = `https://www.google.com/maps/search/?api=1&query=${ENCODED_ADDRESS}`;
export const GOOGLE_MAPS_EMBED_URL = `https://maps.google.com/maps?q=${ENCODED_ADDRESS}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
export const WAZE_NAV_URL = `https://waze.com/ul?q=${ENCODED_ADDRESS}&navigate=yes`;

// Base time slots:
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

// =========================================================================
// 8. NOSSA EQUIPE (DADOS EDITÁVEIS)
// Adicione, edite ou remova profissionais da barbearia aqui.
// =========================================================================
export const DEFAULT_BARBERS = [
  {
    id: 'flayder',
    name: 'Flayder Willis',
    role: 'Mestre Barbeiro & Fundador',
    specialty: 'Visagismo, Cortes Clássicos & Barboterapia',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
    bio: 'Mais de 10 anos de experiência transformando visuais com precisão e técnica impecável.'
  },
  {
    id: 'lucas',
    name: 'Lucas Duarte',
    role: 'Barbeiro Profissional',
    specialty: 'Degradê Navalhado, Fade & Freestyle',
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    bio: 'Especialista em transições limpas e finalizações modernas para o dia a dia.'
  },
  {
    id: 'mateus',
    name: 'Mateus Silva',
    role: 'Barbeiro Especialista',
    specialty: 'Design de Barba, Pigmentação & Alinhamento',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    bio: 'Cuidado nos mínimos detalhes para valorizar o formato do rosto e barba.'
  }
];

// =========================================================================
// 9. CURSO DE BARBEIRO (DADOS EDITÁVEIS)
// Edite as informações sobre o curso profissionalizante oferecido.
// =========================================================================
export const COURSE_INFO = {
  title: 'Curso de Barbeiro Profissional',
  subtitle: 'Aprenda a profissão que mais cresce com quem é referência',
  workload: '60 Horas Práticas e Teóricas',
  certificate: 'Certificado de Conclusão Incluso',
  description:
    'Torne-se um barbeiro de sucesso com treinamento 100% focado no atendimento prático. Aprenda visagismo, degradê (fade), cortes clássicos e modernos, barboterapia, navalhamento perfeito e técnicas de gestão e fidelização de clientes.',
  // Foto da entrega de diplomas ou turma (pode ser trocada por qualquer link de imagem)
  imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
  whatsappMessage: 'Olá! Quero saber mais sobre o curso de barbeiro.'
};

