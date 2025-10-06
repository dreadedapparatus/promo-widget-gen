
import { Product } from './types';

export const EXPECTED_COLUMNS: string[] = [
  'Product name', 'Item number', 'Product description', 'Brand Name', 'Brand Logo URL', 'Special Promo Text', 'MSRP', 'MAP', 'Dealer Price', 'Elite Dealer Price',
  'Image URL', 'Product URL'
];

export const TEMPLATE_DATA: Product[] = [
  {
    'product name': "Performance Widget",
    'item number': "W-001",
    'product description': "Experience unparalleled performance and reliability with our next-generation widget, designed for professionals.",
    'brand name': "Acme Corp",
    'brand logo url': "https://placehold.co/120x60/cccccc/000000?text=ACME",
    'special promo text': '20% OFF!',
    'msrp': 199.99,
    'map': 179.99,
    'dealer price': 149.99,
    'elite dealer price': 139.99,
    'image url': "https://placehold.co/400x300/007bff/white?text=Product+1",
    'product url': "https://example.com/product1",
    'flash sale': '',
    'flash start date': '',
    'flash end date': '',
    'flash badge text': ''
  },
  {
    'product name': "Synergy Gadget",
    'item number': "G-002",
    'product description': "Seamlessly integrates with your workflow, boosting productivity and collaboration.",
    'brand name': "Globex Inc",
    'brand logo url': "https://placehold.co/120x60/28a745/ffffff?text=GLOBEX",
    'special promo text': '',
    'msrp': 249.99,
    'map': 229.99,
    'dealer price': 199.99,
    'elite dealer price': '',
    'image url': "https://placehold.co/400x300/28a745/white?text=Product+2",
    'product url': "https://example.com/product2",
    'flash sale': 'Yes',
    'flash start date': '2025-09-15',
    'flash end date': '2025-09-21',
    'flash badge text': '⚡ Weekly Flash'
  },
  {
    'product name': "Quantum Device",
    'item number': "D-003",
    'product description': "Cutting-edge technology in a compact form factor.",
    'brand name': "Acme Corp",
    'brand logo url': "https://placehold.co/120x60/cccccc/000000?text=ACME",
    'special promo text': 'Free Shipping',
    'msrp': 99.50,
    'map': 89.50,
    'dealer price': 75.00,
    'elite dealer price': 69.99,
    'image url': "https://placehold.co/400x300/6c757d/white?text=Product+3",
    'product url': "https://example.com/product3",
    'flash sale': '',
    'flash start date': '',
    'flash end date': '',
    'flash badge text': ''
  }
];
