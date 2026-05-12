export interface CartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  merchantId: number;
  cartId: string;
}

export interface Cart {
  cartId: string; // Same as UserId
  items: CartItem[];
  totalPrice: number;
}

export interface AddToCartDto {
  productId: string | number;
  productName: string;
  price: number;
  quantity: number;
  merchantId: string | number;
}
