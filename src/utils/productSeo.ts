import { Product } from '../types';

const SITE_URL = 'https://agrocordoba.onrender.com';

export const getProductSlug = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const getProductPath = (product: Product): string =>
  `/producto/${getProductSlug(product.name)}/${encodeURIComponent(product.id)}`;

export const getProductStructuredData = (product: Product) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.image.startsWith('http')
    ? product.image
    : `${SITE_URL}${product.image.startsWith('/') ? '' : '/'}${product.image}`,
  sku: product.id,
  category: product.category,
  url: `${SITE_URL}${getProductPath(product)}`,
  brand: {
    '@type': 'Brand',
    name: 'AgroCórdoba',
  },
  ...(product.producerId
    ? {
        offers: {
    '@type': 'Offer',
    url: `${SITE_URL}${getProductPath(product)}`,
    priceCurrency: 'COP',
    price: product.priceCopKg,
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: product.priceCopKg,
      priceCurrency: 'COP',
      unitCode: 'KGM',
      referenceQuantity: {
        '@type': 'QuantitativeValue',
        value: 1,
        unitCode: 'KGM',
      },
    },
    availability:
      product.stockAvailableKg > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    seller: {
      '@type': 'Person',
      name: product.producerName,
    },
    areaServed: {
      '@type': 'City',
      name: product.municipalityName,
    },
        },
      }
    : {}),
});

export const getProductListStructuredData = (products: Product[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: products.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      ...getProductStructuredData(product),
      '@context': undefined,
    },
  })),
});
