import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import BottomNav from '../components/BottomNav';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/Modal';
import { showToast } from '../components/Toast';
import { EmptyState } from '../components/EmptyState';
import { ListSkeleton } from '../components/LoadingSkeleton';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku?: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  reorderLevel: number;
  category?: string;
  shopId: string;
}

export default function Inventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [stockAdjust, setStockAdjust] = useState<{ product: Product; type: 'add' | 'remove' } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    costPrice: '',
    sellPrice: '',
    stock: '',
    reorderLevel: '5',
    category: '',
  });

  useEffect(() => {
    if (!localStorage.getItem('ownerPhone')) navigate('/');
  }, [navigate]);

  useEffect(() => {
    const q = collection(db, 'products');

    const unsub = onSnapshot(q, (snapshot) => {
      const data: Product[] = [];
      snapshot.forEach((docSnap) => {
        const product = docSnap.data() as Product;
        if (product.shopId === (auth.currentUser?.uid || 'demo-shop')) {
          data.push({ ...product, id: docSnap.id });
        }
      });
      data.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(data);
      setLoading(false);
    });

    return unsub;
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = products.filter((p) => p.stock <= p.reorderLevel).length;
  const totalValue = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      costPrice: '',
      sellPrice: '',
      stock: '',
      reorderLevel: '5',
      category: '',
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.sellPrice) {
      showToast('Name and sell price are required', 'error');
      return;
    }

    const productData = {
      name: formData.name,
      sku: formData.sku || null,
      costPrice: Number(formData.costPrice) || 0,
      sellPrice: Number(formData.sellPrice),
      stock: Number(formData.stock) || 0,
      reorderLevel: Number(formData.reorderLevel) || 5,
      category: formData.category || null,
      shopId: auth.currentUser?.uid || 'demo-shop',
    };

    try {
      if (editProduct) {
        await updateDoc(doc(db, 'products', editProduct.id), productData);
        showToast('Product updated!', 'success');
      } else {
        await addDoc(collection(db, 'products'), productData);
        showToast('Product added!', 'success');
      }
      setShowAddModal(false);
      setEditProduct(null);
      resetForm();
    } catch {
      showToast('Failed to save product', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    try {
      await deleteDoc(doc(db, 'products', deleteProduct.id));
      showToast('Product deleted', 'success');
    } catch {
      showToast('Failed to delete', 'error');
    }
    setDeleteProduct(null);
  };

  const handleStockAdjust = async () => {
    if (!stockAdjust || !adjustAmount) return;
    const amount = Number(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }

    const newStock =
      stockAdjust.type === 'add'
        ? stockAdjust.product.stock + amount
        : Math.max(0, stockAdjust.product.stock - amount);

    try {
      await updateDoc(doc(db, 'products', stockAdjust.product.id), { stock: newStock });
      showToast(`Stock ${stockAdjust.type === 'add' ? 'added' : 'removed'}!`, 'success');
    } catch {
      showToast('Failed to update stock', 'error');
    }
    setStockAdjust(null);
    setAdjustAmount('');
  };

  const openEdit = (product: Product) => {
    setFormData({
      name: product.name,
      sku: product.sku || '',
      costPrice: product.costPrice.toString(),
      sellPrice: product.sellPrice.toString(),
      stock: product.stock.toString(),
      reorderLevel: product.reorderLevel.toString(),
      category: product.category || '',
    });
    setEditProduct(product);
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-surface p-4 pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventory</h1>
          <p className="text-gray-400">
            {products.length} products | Value: {totalValue.toLocaleString()} ETB
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            resetForm();
            setEditProduct(null);
            setShowAddModal(true);
          }}
          className="p-3 rounded-2xl bg-gradient-to-r from-primary to-accent shadow-xl"
        >
          <Plus size={24} className="text-white" />
        </motion.button>
      </div>

      {lowStockCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-4 mb-4 flex items-center gap-3"
        >
          <AlertTriangle className="text-yellow-500" size={24} />
          <div>
            <p className="text-yellow-500 font-medium">Low Stock Alert</p>
            <p className="text-yellow-500/80 text-sm">{lowStockCount} products need restocking</p>
          </div>
        </motion.div>
      )}

      <div className="relative mb-4">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-card rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-400 border border-accent/20 focus:border-accent/50 transition"
        />
      </div>

      {loading ? (
        <ListSkeleton count={4} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Products Yet"
          description="Add your first product to start tracking inventory"
          action={{
            label: 'Add Product',
            onClick: () => setShowAddModal(true),
          }}
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredProducts.map((product, index) => {
              const isLowStock = product.stock <= product.reorderLevel;
              const profit = product.sellPrice - product.costPrice;
              const margin = product.costPrice > 0 ? ((profit / product.costPrice) * 100).toFixed(0) : '0';

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-card rounded-2xl p-4 border-2 transition-all ${
                    isLowStock ? 'border-yellow-500/50' : 'border-accent/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{product.name}</h3>
                        {isLowStock && (
                          <TrendingDown size={16} className="text-yellow-500" />
                        )}
                      </div>
                      {product.sku && (
                        <p className="text-sm text-gray-400">SKU: {product.sku}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">
                        {product.sellPrice.toLocaleString()} ETB
                      </p>
                      <p className="text-sm text-success">+{margin}% margin</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`px-3 py-1 rounded-xl text-sm font-medium ${
                          isLowStock
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-success/20 text-success'
                        }`}
                      >
                        {product.stock} in stock
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setStockAdjust({ product, type: 'add' })}
                          className="p-2 rounded-xl bg-success/20 hover:bg-success/30 transition"
                        >
                          <ArrowUp size={16} className="text-success" />
                        </button>
                        <button
                          onClick={() => setStockAdjust({ product, type: 'remove' })}
                          className="p-2 rounded-xl bg-danger/20 hover:bg-danger/30 transition"
                        >
                          <ArrowDown size={16} className="text-danger" />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="p-2 rounded-xl bg-accent/20 hover:bg-accent/30 transition"
                      >
                        <Edit2 size={18} className="text-accent" />
                      </button>
                      <button
                        onClick={() => setDeleteProduct(product)}
                        className="p-2 rounded-xl bg-danger/20 hover:bg-danger/30 transition"
                      >
                        <Trash2 size={18} className="text-danger" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditProduct(null);
          resetForm();
        }}
        title={editProduct ? 'Edit Product' : 'Add Product'}
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Product Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-surface/50 rounded-xl px-4 py-3 text-white placeholder-gray-400"
          />
          <input
            type="text"
            placeholder="SKU (optional)"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            className="w-full bg-surface/50 rounded-xl px-4 py-3 text-white placeholder-gray-400"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Cost Price"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              className="bg-surface/50 rounded-xl px-4 py-3 text-white placeholder-gray-400"
            />
            <input
              type="number"
              placeholder="Sell Price *"
              value={formData.sellPrice}
              onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
              className="bg-surface/50 rounded-xl px-4 py-3 text-white placeholder-gray-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Current Stock"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="bg-surface/50 rounded-xl px-4 py-3 text-white placeholder-gray-400"
            />
            <input
              type="number"
              placeholder="Reorder Level"
              value={formData.reorderLevel}
              onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
              className="bg-surface/50 rounded-xl px-4 py-3 text-white placeholder-gray-400"
            />
          </div>
          <input
            type="text"
            placeholder="Category (optional)"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full bg-surface/50 rounded-xl px-4 py-3 text-white placeholder-gray-400"
          />
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-lg"
          >
            {editProduct ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!stockAdjust}
        onClose={() => {
          setStockAdjust(null);
          setAdjustAmount('');
        }}
        title={stockAdjust?.type === 'add' ? 'Add Stock' : 'Remove Stock'}
        size="sm"
      >
        {stockAdjust && (
          <div className="space-y-4">
            <p className="text-gray-300">
              {stockAdjust.product.name} - Current: {stockAdjust.product.stock}
            </p>
            <input
              type="number"
              placeholder="Amount"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="w-full bg-surface/50 rounded-xl px-4 py-3 text-white placeholder-gray-400"
              autoFocus
            />
            <button
              onClick={handleStockAdjust}
              className={`w-full py-3 rounded-xl font-bold text-white ${
                stockAdjust.type === 'add' ? 'bg-success' : 'bg-danger'
              }`}
            >
              {stockAdjust.type === 'add' ? 'Add Stock' : 'Remove Stock'}
            </button>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteProduct?.name}"?`}
        confirmText="Delete"
        variant="danger"
      />

      <BottomNav />
    </div>
  );
}
