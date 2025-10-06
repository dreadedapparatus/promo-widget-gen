
export interface Product {
  'product name': string;
  'item number': string;
  'product description': string;
  'brand name': string;
  'brand logo url': string;
  'special promo text'?: string;
  'msrp'?: number | string;
  'map'?: number | string;
  'dealer price'?: number | string;
  'elite dealer price'?: number | string;
  'image url': string;
  'product url': string;
  'flash sale'?: string | boolean | number;
  'flash start date'?: string | number;
  'flash end date'?: string | number;
  'flash badge text'?: string;
  [key: string]: any; // Allows for other potential columns from the spreadsheet
}
