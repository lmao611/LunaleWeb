import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import axios from "../lib/axios";
import LoadingSpinner from "./LoadingSpinner";

const PeopleAlsoBought = ({ excludeIds = [] }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const productId = excludeIds[0];

  const isFeedbackCategory = (category) => {
    if (!category || typeof category !== "string") return false;
    const clean = category.trim().toLowerCase();
    return clean === "feedback" || clean.includes("feed") || clean.includes("fb");
  };

  const checkIsSale = (p) => {
    return (p.isSale === true || p.isSale === "true" || p.isSale === 1) && (Number(p.salePercentage) > 0);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(
          `/products/recommendations?excludeIds=${excludeIds.join(",")}`
        );

        let products = Array.isArray(res.data) ? res.data : [];

        products = products.filter((p) => !isFeedbackCategory(p.category) && !checkIsSale(p) && !p.isHidden);

        if (products.length < 8) {
          const allRes = await axios.get("/products");
          const allProducts = Array.isArray(allRes.data.products)
            ? allRes.data.products
            : [];

          const validProducts = allProducts.filter(
            (p) =>
              !isFeedbackCategory(p.category) &&
              !excludeIds.includes(p._id) &&
              !products.find((prod) => prod._id === p._id) &&
              !checkIsSale(p) &&
              !p.isHidden
          );

          const extra = validProducts
            .sort(() => Math.random() - 0.5)
            .slice(0, 8 - products.length);

          products = [...products, ...extra];
        }

        if (isMounted) setRecommendations(products.slice(0, 8));
      } catch (error) {
        console.error("❌ Fetch recommendations failed:", error);
        if (isMounted) setRecommendations([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (productId) fetchRecommendations();

    return () => {
      isMounted = false;
    };
  }, [productId, excludeIds]);

  if (isLoading) return <LoadingSpinner />;
  if (recommendations.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold text-black text-center">
        Gợi ý cho bạn
      </h3>
      <div className="mt-6 flex justify-center">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-12">
          {recommendations.map((product) => (
            <ProductCard
              key={product._id}
              product={{
                ...product,
                image: product.image || "/placeholder.png",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PeopleAlsoBought;