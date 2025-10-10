import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";

const PeopleAlsoBought = ({ excludeIds = [] }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use the first ID as the product identifier
  const productId = excludeIds[0];

  useEffect(() => {
    let isMounted = true;

    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(
          `/products/recommendations?excludeIds=${excludeIds.join(",")}`
        );

        let products = res.data;

        if (products.length < 8) {
          const allRes = await axios.get("/products");
          const extra = allRes.data.products
            .filter(
              (p) =>
                !excludeIds.includes(p._id) &&
                !products.find((prod) => prod._id === p._id)
            )
            .sort(() => Math.random() - 0.5)
            .slice(0, 8 - products.length);

          products = [...products, ...extra];
        }

        if (isMounted) setRecommendations(products.slice(0, 8));
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "An error occurred while fetching recommendations"
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (productId) {
      fetchRecommendations();
    }

    return () => {
      isMounted = false;
    };
  }, [productId]); // ✅ Only re-fetch when product changes

  if (isLoading) return <LoadingSpinner />;
  if (recommendations.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold text-blue-800">People also bought</h3>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-12">
        {recommendations.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default PeopleAlsoBought;