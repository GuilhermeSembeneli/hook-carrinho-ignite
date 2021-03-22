import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get<Stock>(`/stock/${productId}`);

      const cartFind = cart.findIndex((product) => product.id === productId);
      
      if (cartFind < 0) {
        if (data.amount < 1) {
          toast.error('Quantidade solicitada fora de estoque')
          return;
        }

        const { data: product } = await api.get(`/products/${productId}`);

        const cartData = [...cart, { ...product, amount: 1 }];

        setCart(cartData);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartData));
      } else {
        const ProductAmount = cart[cartFind].amount + 1;

        if (data.amount < ProductAmount) {
          toast.error('Quantidade solicitada fora de estoque')
          return;
        }

        const cartData = cart.map((product) =>
          product.id === productId
            ? { ...product, amount: ProductAmount }
            : product
        );
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartData));
        setCart(cartData);

      }
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartFind = cart.findIndex((product) => product.id === productId);
      if (cartFind < 0) {
        toast.error('Erro na remoção do produto')
        return;
      }
      const cartData = cart.filter((product) => product.id !== productId);
      setCart(cartData);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartData));
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const cartFind = cart.findIndex((product) => product.id === productId);
      if (cartFind < 0) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }

      if (amount < 1) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }

      const { data } = await api.get<Stock>(`/stock/${productId}`);

      if (data.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      const cartData = cart.map((product) =>
        product.id === productId ? { ...product, amount: amount } : product
      );
      setCart(cartData);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartData));
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
