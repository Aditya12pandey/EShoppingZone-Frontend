export interface DeliveryAddress {
  fullName: string;
  mobileNumber: string;
  flatNumber: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface Order {
  orderId: number;
  orderDate: Date;
  customerId: number;
  merchantId: number;
  amountPaid: number;
  modeOfPayment: string;
  orderStatus: string;
  quantity: number;
  productName: string;
  productId: number;
  address: DeliveryAddress;
}

export interface PlaceOrderDto {
  customerId: string;
  merchantId: number;
  amountPaid: number;
  modeOfPayment: string;
  quantity: number;
  productName: string;
  productId: string | number;
  address: DeliveryAddress; // Must match backend name "Address"
}

export interface ChangeStatusDto {
  orderId: string | number;
  status: string;
}
