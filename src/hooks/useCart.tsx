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
      //resgatar todos os produtos
      const updatedProduct = [...cart];
      // verifica se o produto existe
      let storageProduct = updatedProduct.find(
        (product) => product.id === productId
      );

      const { data } = await api.get("/stock/" + productId);
      // atribui a quantidade do produto
      const amount = storageProduct ? storageProduct.amount : 0;
      if (amount + 1 > data.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      if (storageProduct) {
        storageProduct.amount = amount + 1;
      } else {
        const products = await api.get(`/products/${productId}`);
        const newProduct = {
          ...products.data,
          amount: 1,
        };
        updatedProduct.push(newProduct);
      }
      setCart(updatedProduct);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedProduct));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removeCart = [...cart];
      const productExists = removeCart.findIndex(
        (product) => product.id === productId
      );
      if (productExists >= 0) {
        removeCart.splice(productExists, 1);
        setCart(removeCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(removeCart));
      } else {
        toast.error("Erro na remoção do produto");
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updatedAmount = [...cart];
      const productLess = updatedAmount.find(
        (product) => product.id === productId
      );
      if (amount <= 0) {
        return;
      }
      const { data } = await api.get(`/stock/${productId}`);
      if (amount > data.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productLess) {
        productLess.amount = amount;
        setCart(updatedAmount);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(updatedAmount)
        );
      } else {
        toast.error("Erro na alteração de quantidade do produto");
        return
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
