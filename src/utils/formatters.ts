import { USD_EXCHANGE_RATE } from '../data/mockData';

export function formatCop(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPrice(amountCop: number, currency: 'COP' | 'USD'): string {
  if (currency === 'USD') {
    const usd = amountCop / USD_EXCHANGE_RATE;
    return `${formatUsd(usd)} /kg`;
  }
  return `${formatCop(amountCop)} /kg`;
}

export function formatShortProductName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

export function calculateVolumeDiscount(quantityKg: number): number {
  if (quantityKg >= 5000) return 10;
  if (quantityKg >= 2000) return 7;
  if (quantityKg >= 500) return 4;
  return 0;
}

export function generateWhatsAppLink(params: {
  phone: string;
  producerName: string;
  productName: string;
  variety: string;
  clientName: string;
  clientBusinessType: string;
  clientCity: string;
  quantityKg: number;
  totalCop: number;
  destinationZone: string;
}): string {
  const cleanPhone = params.phone.replace(/[^0-9]/g, '');
  const message = `*SOLICITUD DE COTIZACIÓN AGROCÓRDOBA*\n\n` +
    `¡Hola Don/Doña ${params.producerName}!\n` +
    `Le escribo a través de la plataforma *AgroCórdoba (AgroConecta)*.\n\n` +
    `*Datos del Comprador:*\n` +
    `• Nombre: ${params.clientName || 'Cliente Mayorista'}\n` +
    `• Tipo de Negocio: ${params.clientBusinessType}\n` +
    `• Ciudad / Destino: ${params.clientCity || params.destinationZone}\n\n` +
    `*Detalle de la Cosecha:*` +
    `\n• Producto: ${params.productName}` +
    `\n• Variedad: ${params.variety}` +
    `\n• Cantidad requerida: ${params.quantityKg.toLocaleString('es-CO')} kg` +
    `\n• Valor estimado base: ${formatCop(params.totalCop)} COP\n` +
    `\n¿Tienen disponibilidad para despacho en esta fecha y condiciones de flete? Quedo atento(a) para coordinar el pedido. ¡Muchas gracias!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
