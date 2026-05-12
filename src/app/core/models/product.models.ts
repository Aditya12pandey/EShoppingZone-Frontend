export interface Product {
  productId: string;
  productType: string;
  productName: string;
  category: string;
  image: string[];
  price: number;
  description: string;
  specification: Record<string, string>;
  merchantId: string;
  rating?: Record<number, number>;
  review?: Record<number, string>;
}

export interface AddProductDto {
  productType: string;
  productName: string;
  category: string;
  image: string[];
  price: number;
  description: string;
  specification: Record<string, string>;
}
