import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { products } from '../data/products';

export default function Products() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    // Set products data
    setAllProducts(products);
    setFilteredProducts(products);
  }, []);
  
  useEffect(() => {
    if (categoryFilter === 'all') {
      setFilteredProducts(allProducts);
    } else {
      setFilteredProducts(
        allProducts.filter((product) => product.category === categoryFilter)
      );
    }
  }, [categoryFilter, allProducts]);
  
  // Get unique categories
  const categories = [
    'all',
    ...new Set(allProducts.map((product) => product.category)),
  ];
  
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-primary-50">
        <div className="container text-center">
          <h1 className="mb-4">Beauty Products</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our collection of premium beauty products carefully selected to help you maintain
            your salon look at home. All products are cruelty-free and made with high-quality ingredients.
          </p>
        </div>
      </section>
      
      {/* Products Section */}
      <section className="section">
        <div className="container">
          {/* Category Filters */}
          <div className="mb-12 flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setCategoryFilter(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products found for this category.</p>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}