import { getProducts } from "../../lib/catalog";
import type { SearchParams } from "../../lib/catalog-model";
import ProductsContent from "./ProductsContent";
export const metadata = { title: "The marketplace" };
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [params, result] = await Promise.all([searchParams, getProducts()]);
  return (
    <>
      <div className="page-intro">
        <div className="container">
          <p className="eyebrow">SMALL SHOPS. GOOD FINDS.</p>
          <h1>The marketplace.</h1>
          <p>A little of everything, from stores with something to share.</p>
        </div>
      </div>
      <ProductsContent
        products={result.data}
        params={params}
        error={result.error}
      />
    </>
  );
}
