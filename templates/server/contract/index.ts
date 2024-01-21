export type Product = {
  id: number;
  name: string;
};

export type Api = {
  fetchProducts: () => Promise<Array<Product>>;
};
