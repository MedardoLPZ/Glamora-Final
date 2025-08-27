import React, { useState } from 'react';
import { X, Package, DollarSign, Plus, Tag, Camera, Upload, Trash2 } from 'lucide-react';
import { Product } from '../types/salon';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProducts: (products: Product[]) => void;
  products: Product[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  onUpdateProducts,
  products,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [inStock, setInStock] = useState(true);
  const [photo, setPhoto] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  if (!isOpen) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhoto(result);
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPhoto(url);
    setPhotoPreview(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && price && category) {
      onAddProduct({
        name,
        price: parseFloat(price),
        category,
        description: description || undefined,
        inStock,
        photo: photo || undefined,
      });
      setName('');
      setPrice('');
      setCategory('');
      setDescription('');
      setInStock(true);
      setPhoto('');
      setPhotoPreview('');
      onClose();
    }
  };

  const handleUpdateProduct = (index: number, updated: Product) => {
    const next = [...products];
    next[index] = updated;
    onUpdateProducts(next);
  };

  const handleDeleteProduct = (index: number) => {
    const next = products.filter((_, i) => i !== index);
    onUpdateProducts(next);
  };

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col">
        
        {/* Solid pink header */}
        <div className="bg-pink-500 px-6 py-4 text-white sticky top-0 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Manage Products</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Current Products */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Products</h3>
            <div className="space-y-4">
              {products.map((product, index) => (
                <div key={product.id} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) =>
                        handleUpdateProduct(index, { ...product, name: e.target.value })
                      }
                      className="w-1/2 px-3 py-2 border rounded-lg"
                      placeholder="Name"
                    />
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) =>
                        handleUpdateProduct(index, { ...product, price: parseFloat(e.target.value) })
                      }
                      className="w-1/4 px-3 py-2 border rounded-lg"
                      placeholder="Price"
                    />
                    <button
                      onClick={() => handleDeleteProduct(index)}
                      className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={product.category}
                    onChange={(e) =>
                      handleUpdateProduct(index, { ...product, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Category"
                  />
                  <input
                    type="text"
                    value={product.photo || ''}
                    onChange={(e) =>
                      handleUpdateProduct(index, { ...product, photo: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Photo URL"
                  />
                  <textarea
                    value={product.description || ''}
                    onChange={(e) =>
                      handleUpdateProduct(index, { ...product, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Description"
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={product.inStock}
                      onChange={(e) =>
                        handleUpdateProduct(index, { ...product, inStock: e.target.checked })
                      }
                    />
                    In Stock
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Product */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Plus className="mr-2" size={20} />
              Add New Product
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Product Name"
                required
              />
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Price"
                required
              />
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Category"
                required
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Description"
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="mr-2"
                />
                In Stock
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
              >
                Add Product
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-pink-500 px-4 py-2 text-white hover:bg-pink-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};