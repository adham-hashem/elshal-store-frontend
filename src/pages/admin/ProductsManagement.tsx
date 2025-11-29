import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Upload, Menu, X, ChevronLeft, ChevronRight, EyeOff, Eye, Package, Zap, Sunrise, Snowflake } from 'lucide-react'; // أضفت Sunrise و Snowflake

// Assuming you have a file at this path
import { useAuth } from '../../contexts/AuthContext';

interface ProductImage {
  id: string;
  imagePath: string;
  isMain: boolean;
}

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  createdAt: string;
  category: number;
  sizes: string[];
  colors: string[];
  images: ProductImage[];
  inStock?: boolean;
  isHidden: boolean;
  isAvailable: boolean;
  season: number; // 0 for All, 1 for Summer, 2 for Winter (based on backend enum)
  rowVersion: string;
}

interface PaginatedResponse {
  items: Product[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// واجهة جديدة لحالة الرؤية الموسمية العامة
interface SeasonVisibility {
    showSummer: boolean;
    showWinter: boolean;
}

const ProductsManagement: React.FC = () => {
  const { isAuthenticated, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState('products');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

    // حالة جديدة لحفظ إعدادات الرؤية الموسمية
    const [seasonVisibility, setSeasonVisibility] = useState<SeasonVisibility>({
        showSummer: true,
        showWinter: true,
    });

  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    price: '',
    originalPrice: '',
    description: '',
    sizes: [''],
    colors: [''],
    category: 0,
    images: [''],
    isHidden: false,
    isAvailable: true,
    season: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const getAuthToken = () => {
      const authToken = localStorage.getItem('accessToken');
      console.log('Retrieved token:', authToken ? 'Token found' : 'No token found');
      setToken(authToken);
      return authToken;
    };

    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    if (userRole !== 'admin') {
      console.log('User is not admin, redirecting to home');
      navigate('/');
      return;
    }

    getAuthToken();
  }, [isAuthenticated, userRole, navigate]);
  
  // دالة جلب حالة الرؤية الموسمية
    const fetchSeasonVisibility = useCallback(async (authToken: string) => {
        try {
            const response = await fetch(`${apiUrl}/api/admin/season-visibility`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
            });
            if (response.ok) {
                const data: SeasonVisibility = await response.json();
                setSeasonVisibility(data);
            } else {
                console.error('Failed to fetch season visibility:', response.status);
            }
        } catch (error) {
            console.error('Error fetching season visibility:', error);
        }
    }, [apiUrl]);

  useEffect(() => {
    if (token) {
      refreshProductsList(currentPage);
      fetchSeasonVisibility(token); // جلب حالة الرؤية الموسمية
    }
  }, [token, currentPage, fetchSeasonVisibility]);

  useEffect(() => {
    console.log('Current products:', products.length, 'items');
    console.log('Products data:', products);
  }, [products]);

  const handleLogout = () => {
    logout();
    navigate('/');
    alert('تم تسجيل خروج المدير بنجاح');
  };

  const validateToken = () => {
    if (!token) {
      alert('لم يتم العثور على رمز المصادقة. يرجى تسجيل الدخول مرة أخرى.');
      navigate('/login');
      return false;
    }
    return true;
  };

  const refreshProductsList = async (page: number) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/products?pageNumber=${page}&pageSize=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (response.ok) {
        const data: PaginatedResponse = JSON.parse(responseText);
        console.log('Parsed data:', data);
        if (data && Array.isArray(data.items)) {
          const mappedProducts: Product[] = data.items.map(item => ({
            ...item,
            // Ensure properties exist with fallback values
            inStock: item.isAvailable,
            isHidden: item.isHidden ?? false,
            isAvailable: item.isAvailable ?? false,
            season: item.season ?? 0,
            rowVersion: item.rowVersion,
            images: item.images.map(img => ({
              id: img.id,
              // URL construction: Append apiUrl only if the path is relative (starts with / but not a domain)
              imagePath: img.imagePath && img.imagePath.startsWith('/') && !img.imagePath.startsWith('http')
                ? `${apiUrl}${img.imagePath}`
                : img.imagePath,
              isMain: img.isMain,
            })),
          }));
          console.log('Mapped products:', mappedProducts);
          setProducts(mappedProducts);
          setTotalPages(data.totalPages);
          console.log('Products state updated successfully');
        } else {
          console.error('Invalid response format:', data);
          alert('تنسيق البيانات غير صحيح');
        }
      } else {
        console.error('Error fetching products:', responseText);
        alert('فشل في جلب المنتجات');
      }
    } catch (error) {
      console.error('Error refreshing products:', error);
      alert('حدث خطأ أثناء جلب المنتجات');
    } finally {
      setIsLoading(false);
    }
  };

  const checkProductCodeExists = (code: string, excludeId?: string): boolean => {
    return products.some(product =>
      product.code.toLowerCase() === code.toLowerCase() &&
      product.id !== excludeId
    );
  };

  const handleAddProduct = async () => {
    if (isLoading) return;

    if (!validateToken()) return;

    if (!newProduct.code || !newProduct.name || !newProduct.price) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (checkProductCodeExists(newProduct.code)) {
      alert('كود المنتج مُستخدم بالفعل. يرجى استخدام كود مختلف.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('code', newProduct.code);
      formData.append('price', newProduct.price);
      formData.append('description', newProduct.description || '');

      // New properties included in creation
      formData.append('isHidden', newProduct.isHidden.toString());
      formData.append('isAvailable', newProduct.isAvailable.toString());
      formData.append('season', newProduct.season.toString());

      newProduct.sizes
        .filter(size => size.trim() !== '')
        .forEach(size => formData.append('sizes[]', size));
      newProduct.colors
        .filter(color => color.trim() !== '')
        .forEach(color => formData.append('colors[]', color));
      formData.append('category', newProduct.category.toString());
      if (newProduct.originalPrice) formData.append('originalPrice', newProduct.originalPrice);
      formData.append('mainImageIndex', '0');

      const imageFiles = await Promise.all(
        newProduct.images
          .filter(img => img.trim() !== '')
          .map(async (img, index) => {
            if (img.startsWith('data:image')) {
              const response = await fetch(img);
              const blob = await response.blob();
              return new File([blob], `image-${index}.jpg`, { type: blob.type });
            }
            return null;
          })
      );

      imageFiles
        .filter(file => file !== null)
        .forEach(file => formData.append('imageFiles', file as File));

      console.log('Sending request to:', `${apiUrl}/api/products`);

      const response = await fetch(`${apiUrl}/api/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);

        if (errorText.includes('already exists')) {
          const codeMatch = errorText.match(/code '([^']+)'/);
          const duplicateCode = codeMatch ? codeMatch[1] : newProduct.code;
          throw new Error(`كود المنتج '${duplicateCode}' مُستخدم بالفعل. يرجى استخدام كود مختلف.`);
        } else if (response.status === 500 && errorText.includes('duplicate key')) {
          throw new Error('كود المنتج مُستخدم بالفعل. يرجى استخدام كود مختلف.');
        } else if (response.status === 400) {
          throw new Error(errorText || 'بيانات المنتج غير صحيحة');
        } else if (response.status === 500) {
          throw new Error(`خطأ في الخادم: ${errorText}`);
        } else {
          throw new Error(`فشل في إضافة المنتج: ${response.status} ${response.statusText}`);
        }
      }

      let result = null;
      const responseText = await response.text();
      if (responseText && responseText.trim()) {
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.log('Response text:', responseText);
        }
      }

      if (result) {
        const newProductWithImages = {
          ...result,
          inStock: result.isAvailable || false,
          isHidden: result.isHidden || false,
          isAvailable: result.isAvailable || false,
          season: result.season ?? 0,
          images: result.images.map((img: ProductImage) => ({
            ...img,
             // URL construction
            imagePath: img.imagePath && img.imagePath.startsWith('/') && !img.imagePath.startsWith('http')
                ? `${apiUrl}${img.imagePath}`
                : img.imagePath,
          })),
        };
        setProducts(prevProducts => [...prevProducts, newProductWithImages]);
      } else {
        console.log('No product data returned from server, refreshing product list');
        await refreshProductsList(currentPage);
      }

      setShowAddProduct(false);
      resetProductForm();
      alert('تم إضافة المنتج بنجاح!');
    } catch (error: any) {
      console.error('Error adding product:', error);
      alert(error.message || 'حدث خطأ أثناء إضافة المنتج');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (isLoading || !editingProduct) return;

    if (!validateToken()) return;

    if (!newProduct.code || !newProduct.name || !newProduct.price) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // NOTE: Removed local check for duplicate code. Rely on server validation.

    setIsLoading(true);
    try {
      const formData = new FormData();

      // Basic product info
      formData.append('name', newProduct.name.trim());
      formData.append('code', newProduct.code.trim());
      formData.append('price', newProduct.price.toString());
      formData.append('description', newProduct.description?.trim() || '');
      formData.append('category', newProduct.category.toString());

      // ✅ IMPORTANT: New Properties (Fixed to ensure update)
      formData.append('isHidden', newProduct.isHidden.toString());
      formData.append('isAvailable', newProduct.isAvailable.toString());
      formData.append('season', newProduct.season.toString());

      // Add original price only if it exists and is not empty
      if (newProduct.originalPrice && newProduct.originalPrice.trim() !== '') {
        formData.append('originalPrice', newProduct.originalPrice.toString());
      }

      // Add sizes array - only non-empty values
      const validSizes = newProduct.sizes.filter(size => size.trim() !== '');
      if (validSizes.length > 0) {
        validSizes.forEach((size, index) => {
          formData.append(`sizes[${index}]`, size.trim());
        });
      } else {
        formData.append('sizes', '');
      }

      // Add colors array - only non-empty values
      const validColors = newProduct.colors.filter(color => color.trim() !== '');
      if (validColors.length > 0) {
        validColors.forEach((color, index) => {
          formData.append(`colors[${index}]`, color.trim());
        });
      } else {
        formData.append('colors', '');
      }

      // Handle images - only add new uploaded images (data: URLs)
      const newImages = [];

      for (let i = 0; i < newProduct.images.length; i++) {
        const img = newProduct.images[i];
        if (img && img.trim() !== '' && img.startsWith('data:image')) {
          try {
            const response = await fetch(img);
            const blob = await response.blob();
            const file = new File([blob], `image-${i}.jpg`, { type: blob.type });
            newImages.push(file);
          } catch (error) {
            console.error('Error processing image:', error);
          }
        }
      }

      // Add new image files to form data
      if (newImages.length > 0) {
        formData.append('mainImageIndex', '0');
        newImages.forEach((file) => {
          formData.append('imageFiles', file);
        });
      }

      console.log('Sending PUT request to:', `${apiUrl}/api/products/${editingProduct.id}`);

      const response = await fetch(`${apiUrl}/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('=== SERVER ERROR RESPONSE ===');
        console.error('Status:', response.status);
        console.error('Response Body:', errorText);
        console.error('=== END SERVER ERROR ===');

        if (errorText.includes('already exists') || errorText.includes('duplicate')) {
          const codeMatch = errorText.match(/code '([^']+)'/);
          const duplicateCode = codeMatch ? codeMatch[1] : newProduct.code;
          throw new Error(`كود المنتج '${duplicateCode}' مُستخدم بالفعل. يرجى استخدام كود مختلف.`);
        } else if (response.status === 400) {
          throw new Error(`خطأ في البيانات المرسلة: ${errorText}`);
        } else if (response.status === 401) {
          throw new Error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
        } else if (response.status === 404) {
          throw new Error('المنتج غير موجود أو تم حذفه.');
        } else if (response.status === 500) {
          if (errorText.includes('constraint') || errorText.includes('foreign key')) {
            throw new Error('خطأ في قاعدة البيانات: قد يكون المنتج مرتبط ببيانات أخرى.');
          } else if (errorText.includes('validation')) {
            throw new Error('خطأ في التحقق من البيانات. تأكد من صحة جميع الحقول.');
          } else {
            throw new Error(`خطأ في الخادم (${response.status}): ${errorText || 'خطأ غير محدد'}`);
          }
        } else {
          throw new Error(`فشل في تحديث المنتج (${response.status}): ${errorText || response.statusText}`);
        }
      }

      let result = null;
      const responseText = await response.text();
      console.log('=== SUCCESS RESPONSE ===');
      console.log('Response text:', responseText);
      console.log('=== END SUCCESS RESPONSE ===');

      if (responseText && responseText.trim()) {
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.log('Raw response text:', responseText);
        }
      }

      // Update the products list
      if (result) {
        const updatedProductWithImages = {
          ...result,
          inStock: result.isAvailable || false,
          isHidden: result.isHidden || false,
          isAvailable: result.isAvailable || false,
          season: result.season ?? 0,
          images: result.images ? result.images.map((img: ProductImage) => ({
            ...img,
             // URL construction
            imagePath: img.imagePath && img.imagePath.startsWith('/') && !img.imagePath.startsWith('http')
                ? `${apiUrl}${img.imagePath}`
                : img.imagePath,
          })) : editingProduct.images,
        };

        setProducts(prevProducts =>
          prevProducts.map(product =>
            product.id === editingProduct.id ? updatedProductWithImages : product
          )
        );
      } else {
        console.log('No product data returned from server, refreshing product list');
        await refreshProductsList(currentPage);
      }

      // Close the edit form and reset
      setShowEditProduct(false);
      setEditingProduct(null);
      resetProductForm();
      alert('تم تحديث المنتج بنجاح!');

    } catch (error: any) {
      console.error('Error updating product:', error);
      alert(error.message || 'حدث خطأ أثناء تحديث المنتج');
    } finally {
      setIsLoading(false);
    }
  };
  
  // دالة تبديل الرؤية الموسمية الفردية (كما كانت في الكود السابق)
  const handleSeasonalHide = async (seasonToToggle: number, action: 'hide' | 'unhide') => {
    if (isLoading) return;
    if (!validateToken()) return;

    const actionText = action === 'hide' ? 'إخفاء' : 'إظهار';
    const seasonName = getSeasonText(seasonToToggle);

    if (!confirm(`هل أنت متأكد من ${actionText} جميع منتجات موسم: ${seasonName}؟\n\nستؤثر هذه العملية على ${
      products.filter(p => p.season === seasonToToggle).length
    } منتج في هذه الصفحة.`)) {
      return;
    }

    setIsLoading(true);
    try {
      // This uses the old product-specific endpoint, which is fine if you still use it for mass updates
      const response = await fetch(`${apiUrl}/api/products/seasonal-toggle/${seasonToToggle}?isHidden=${action === 'hide'}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // Send body even if unused by backend, for consistency
        body: JSON.stringify({ isHidden: action === 'hide' }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`فشل في ${actionText} منتجات موسم ${seasonName}: ${errorText}`);
      }

      alert(`تم ${actionText} جميع منتجات موسم ${seasonName} بنجاح!`);
      // Refresh list to see changes
      await refreshProductsList(currentPage);
    } catch (error: any) {
      console.error('Error in seasonal hide/unhide:', error);
      alert(error.message || 'حدث خطأ أثناء التحديث الموسمي');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 👇 NEW FUNCTION: Handle Global Season Visibility Toggle (using /api/admin/season-visibility)
    const handleGlobalSeasonToggle = async (season: 'summer' | 'winter', show: boolean) => {
        if (!validateToken() || isLoading) return;

        const actionText = show ? 'إظهار' : 'إخفاء';
        const seasonName = season === 'summer' ? 'الصيفي' : 'الشتوي';

        if (!confirm(`هل أنت متأكد من ${actionText} القسم ${seasonName} عالميًا؟`)) {
            return;
        }

        setIsLoading(true);
        try {
            // prepare the payload based on the current state and the change being made
            const payload = {
                ShowSummer: season === 'summer' ? show : seasonVisibility.showSummer,
                ShowWinter: season === 'winter' ? show : seasonVisibility.showWinter,
            };

            const response = await fetch(`${apiUrl}/api/admin/season-visibility`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`فشل في تحديث رؤية الموسم: ${errorText}`);
            }

            // Update the local state based on the successful API response (or fetch again)
            // Assuming the API returns the updated state on success
            const updatedState: { showSummer: boolean, showWinter: boolean } = await response.json();
            setSeasonVisibility(prev => ({ 
                ...prev, 
                showSummer: updatedState.showSummer, 
                showWinter: updatedState.showWinter 
            }));

            alert(`تم ${actionText} القسم ${seasonName} عالميًا بنجاح!`);
        } catch (error: any) {
            console.error('Error toggling global season visibility:', error);
            alert(error.message || 'حدث خطأ أثناء تحديث إعدادات الموسم العامة.');
        } finally {
            setIsLoading(false);
        }
    };


  const resetProductForm = () => {
    setNewProduct({
      code: '',
      name: '',
      price: '',
      originalPrice: '',
      description: '',
      sizes: [''],
      colors: [''],
      category: 0,
      images: [''],
      isHidden: false,
      isAvailable: true,
      season: 0,
    });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      code: product.code,
      name: product.name,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      description: product.description,
      // Filter out images that are just the API URL if we only want to show user-uploaded images/new files
      images: product.images.map(img => img.imagePath),
      sizes: product.sizes,
      colors: product.colors,
      category: product.category,
      isHidden: product.isHidden,
      isAvailable: product.isAvailable,
      season: product.season,
    });
    setShowEditProduct(true);
    setShowSidebar(false); // Close sidebar on mobile
  };

  const handleDeleteProduct = async (productId: string) => {
    const productToDelete = products.find(p => p.id === productId);
    if (!confirm(`هل أنت متأكد من حذف المنتج "${productToDelete?.name}"؟\n\nتحذير: إذا كان المنتج موجود في عربات التسوق أو الطلبات، فلن يمكن حذفه.`)) {
      return;
    }

    if (!validateToken()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);

        if (response.status === 500) {
          if (errorText.includes('REFERENCE constraint') ||
            errorText.includes('FK_CartItems_Products') ||
            errorText.includes('CartItems')) {
            throw new Error('لا يمكن حذف هذا المنتج لأنه موجود في عربات التسوق أو الطلبات الحالية. يرجى إزالته من جميع العربات أولاً أو انتظار حتى يتم إتمام الطلبات المرتبطة به.');
          } else if (errorText.includes('Orders') || errorText.includes('OrderItems')) {
            throw new Error('لا يمكن حذف هذا المنتج لأنه مرتبط بطلبات موجودة. يرجى انتظار حتى يتم معالجة جميع الطلبات المرتبطة به.');
          } else {
            throw new Error(`خطأ في الخادم: ${errorText}`);
          }
        } else if (response.status === 404) {
          throw new Error('المنتج غير موجود أو تم حذفه بالفعل.');
        } else {
          throw new Error(`فشل في حذف المنتج: ${response.status} ${response.statusText}`);
        }
      }

      setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
      await refreshProductsList(currentPage);
      alert('تم حذف المنتج بنجاح!');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      if (error.message.includes('عربات التسوق') || error.message.includes('CartItems')) {
        alert(`❌ ${error.message}\n\n💡 نصيحة: يمكنك إخفاء المنتج بدلاً من حذفه عن طريق تعديله وإلغاء تفعيله.`);
      } else {
        alert(`حدث خطأ أثناء حذف المنتج: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateImageField(index, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addImageField = () => {
    setNewProduct(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const updateImageField = (index: number, value: string) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img)
    }));
  };

  const addSizeField = () => {
    setNewProduct(prev => ({
      ...prev,
      sizes: [...prev.sizes, '']
    }));
  };

  const updateSizeField = (index: number, value: string) => {
    setNewProduct(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => i === index ? value : size)
    }));
  };

  const addColorField = () => {
    setNewProduct(prev => ({
      ...prev,
      colors: [...prev.colors, '']
    }));
  };

  const updateColorField = (index: number, value: string) => {
    setNewProduct(prev => ({
      ...prev,
      colors: prev.colors.map((color, i) => i === index ? value : color)
    }));
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };


  if (!isAuthenticated) {
    return <div className="p-4 text-center">جاري التحقق من المصادقة...</div>;
  }

  if (!token) {
    return <div className="p-4 text-center">جاري تحميل رمز المصادقة...</div>;
  }

  // Helper function to convert season number to Arabic text
  const getSeasonText = (season: number) => {
    switch (season) {
      case 1:
        return 'صيفي';
      case 2:
        return 'شتوي';
      case 0:
      default:
        return 'جميع المواسم';
    }
  };
    
    // محتوى واجهة التحكم في الرؤية الموسمية العامة
    const GlobalSeasonVisibilityControl = () => (
        <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
            <h4 className="text-md font-semibold text-gray-800 border-b pb-2 mb-3">
                <Zap size={18} className='inline ml-1' /> التحكم الموسمي (عام)
            </h4>
            
            {/* Summer Toggle */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center">
                    <Sunrise size={16} className='text-yellow-600 ml-2' /> موسم الصيف (Summer)
                </span>
                <button
                    onClick={() => handleGlobalSeasonToggle('summer', !seasonVisibility.showSummer)}
                    disabled={isLoading}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        seasonVisibility.showSummer 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bg-red-500 hover:bg-red-600 text-white'
                    } disabled:opacity-50`}
                >
                    {seasonVisibility.showSummer ? 'مرئي (إخفاء)' : 'مخفي (إظهار)'}
                </button>
            </div>

            {/* Winter Toggle */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center">
                    <Snowflake size={16} className='text-blue-600 ml-2' /> موسم الشتاء (Winter)
                </span>
                <button
                    onClick={() => handleGlobalSeasonToggle('winter', !seasonVisibility.showWinter)}
                    disabled={isLoading}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        seasonVisibility.showWinter 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bg-red-500 hover:bg-red-600 text-white'
                    } disabled:opacity-50`}
                >
                    {seasonVisibility.showWinter ? 'مرئي (إخفاء)' : 'مخفي (إظهار)'}
                </button>
            </div>
            <p className="text-xs text-gray-500 pt-2">
                * يؤثر هذا الإعداد على ظهور المنتجات **لكافة العملاء** بغض النظر عن إعدادات المنتج الفردية.
            </p>
        </div>
    );


  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold text-gray-800">إدارة المنتجات</h1>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {showSidebar ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Mobile Sidebar */}
        {showSidebar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden" onClick={() => setShowSidebar(false)}>
            <div
              className="fixed right-0 top-0 h-full w-80 bg-gray-50 shadow-xl overflow-y-auto" // تم تغيير الخلفية لتناسب المحتوى الجديد
              onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
            >
              <div className="p-4 space-y-6">
                <div className="flex items-center justify-between mb-4 border-b pb-3">
                  <h3 className="text-lg font-semibold text-gray-800">إدارة عامة</h3>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Mobile Global Season Control */}
                <GlobalSeasonVisibilityControl />

                <div className="space-y-4">
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">إجمالي المنتجات (في الصفحة)</p>
                    <p className="text-2xl font-bold text-pink-600">{products.length}</p>
                  </div>
                    {/* ... (بقية الإحصائيات) */}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1">
          <div className="container mx-auto px-4 py-4 lg:py-8">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              {/* Main Content */}
              <div className="flex-1">
                <div className="bg-white rounded-lg lg:rounded-2xl shadow-lg p-4 lg:p-6">
                  {activeTab === 'products' && (
                    <div>
                      {/* Desktop Header */}
                      <div className="hidden lg:flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">إدارة المنتجات</h2>
                        <div className="flex items-center space-x-reverse space-x-4">
                            {/* START: BUTTONS FOR MANUAL MASS HIDE/UNHIDE */}
                            <button
                                onClick={() => handleSeasonalHide(1, 'hide')} // 1 for Summer
                                disabled={isLoading}
                                className="bg-red-500 text-white px-3 py-2 text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                title="إخفاء جميع منتجات الصيف"
                            >
                                ❌ إخفاء الصيف (فردي)
                            </button>
                            <button
                                onClick={() => handleSeasonalHide(2, 'hide')} // 2 for Winter
                                disabled={isLoading}
                                className="bg-orange-500 text-white px-3 py-2 text-sm rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                                title="إخفاء جميع منتجات الشتاء"
                            >
                                ❌ إخفاء الشتاء (فردي)
                            </button>
                            {/* END: BUTTONS FOR MANUAL MASS HIDE/UNHIDE */}

                          <div className="text-sm text-gray-600">
                            المنتجات: {products.length} | الرمز: {token ? '✅ متوفر' : '❌ غير متوفر'}
                          </div>
                          <button
                            onClick={() => setShowAddProduct(true)}
                            disabled={isLoading}
                            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-reverse space-x-2 disabled:opacity-50"
                          >
                            <Plus size={20} />
                            <span>إضافة منتج</span>
                          </button>
                          <button
                            onClick={handleLogout}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
                          >
                            تسجيل خروج
                          </button>
                        </div>
                      </div>

                      {/* Mobile Add Button */}
                      <div className="lg:hidden mb-4">
                        <div className="flex justify-between items-center">
                          <button
                            onClick={() => setShowAddProduct(true)}
                            disabled={isLoading}
                            className="flex-1 bg-pink-600 text-white px-4 py-3 rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center space-x-reverse space-x-2 disabled:opacity-50 ml-2"
                          >
                            <Plus size={20} />
                            <span>إضافة منتج</span>
                          </button>
                          <button
                            onClick={handleLogout}
                            className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            خروج
                          </button>
                        </div>
                      </div>

                      {/* Product Form */}
                      {(showAddProduct || showEditProduct) && (
                        <div className="mb-6 lg:mb-8 p-4 lg:p-6 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                              {showAddProduct ? 'إضافة منتج جديد' : 'تعديل المنتج'}
                            </h3>
                            <button
                              onClick={() => {
                                setShowAddProduct(false);
                                setShowEditProduct(false);
                                setEditingProduct(null);
                                resetProductForm();
                              }}
                              className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg"
                            >
                              <X size={20} />
                            </button>
                          </div>

                          <div className="space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">كود المنتج *</label>
                                <input
                                  type="text"
                                  value={newProduct.code}
                                  onChange={(e) => setNewProduct(prev => ({ ...prev, code: e.target.value }))}
                                  className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right ${
                                    newProduct.code && checkProductCodeExists(newProduct.code, editingProduct?.id)
                                      ? 'border-red-500 bg-red-50'
                                      : 'border-gray-300'
                                    }`}
                                  dir="rtl"
                                />
                                {newProduct.code && checkProductCodeExists(newProduct.code, editingProduct?.id) && (
                                  <p className="text-red-500 text-sm mt-1">كود المنتج مُستخدم بالفعل</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المنتج *</label>
                                <input
                                  type="text"
                                  value={newProduct.name}
                                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
                                  dir="rtl"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">السعر *</label>
                                <input
                                  type="number"
                                  value={newProduct.price}
                                  onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
                                  dir="rtl"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">السعر الأصلي</label>
                                <input
                                  type="number"
                                  value={newProduct.originalPrice}
                                  onChange={(e) => setNewProduct(prev => ({ ...prev, originalPrice: e.target.value }))}
                                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
                                  dir="rtl"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
                                <select
                                  value={newProduct.category}
                                  onChange={(e) => setNewProduct(prev => ({ ...prev, category: Number(e.target.value) }))}
                                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
                                  dir="rtl"
                                >
                                  <option value={0}>قسم الحريمي</option>
                                  <option value={1}>قسم الأطفال</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">الموسم</label>
                                <select
                                  value={newProduct.season}
                                  onChange={(e) => setNewProduct(prev => ({ ...prev, season: Number(e.target.value) }))}
                                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
                                  dir="rtl"
                                >
                                  <option value={0}>جميع المواسم</option>
                                  <option value={2}>شتوي</option> {/* Backend: Winter = 2 */}
                                  <option value={1}>صيفي</option> {/* Backend: Summer = 1 */}
                                </select>
                              </div>
                            </div>

                            {/* UPDATED: Toggles for isHidden, isAvailable */}
                            <div className="flex flex-wrap gap-6 pt-2">
                              <label className="flex items-center space-x-reverse space-x-3">
                                <input
                                  type="checkbox"
                                  checked={newProduct.isHidden}
                                  onChange={(e) => setNewProduct(prev => ({ ...prev, isHidden: e.target.checked }))}
                                  className="w-5 h-5 text-blue-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">مخفي عن العملاء</span>
                              </label>
                              <label className="flex items-center space-x-reverse space-x-3">
                                <input
                                  type="checkbox"
                                  checked={newProduct.isAvailable}
                                  onChange={(e) => setNewProduct(prev => ({ ...prev, isAvailable: e.target.checked }))}
                                  className="w-5 h-5 text-green-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">متاح / متوفر</span>
                              </label>
                            </div>


                            {/* Description */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                              <textarea
                                value={newProduct.description}
                                onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
                                dir="rtl"
                              />
                            </div>

                            {/* Images */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">صور المنتج</label>
                              <div className="space-y-3">
                                {newProduct.images.map((image, index) => (
                                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white rounded-lg border">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleImageUpload(index, e)}
                                      className="hidden"
                                      id={`image-upload-${index}`}
                                    />
                                    <label
                                      htmlFor={`image-upload-${index}`}
                                      className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg cursor-pointer flex items-center space-x-reverse space-x-2 transition-colors"
                                    >
                                      <Upload size={16} />
                                      <span className="text-sm">اختر صورة</span>
                                    </label>
                                    {image && (
                                      <div className="flex items-center space-x-reverse space-x-2">
                                        <img src={image} alt="" className="w-12 h-12 object-cover rounded" />
                                        <span className="text-sm text-green-600">تم الرفع</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={addImageField}
                                  className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                                >
                                  + إضافة صورة أخرى
                                </button>
                              </div>
                            </div>

                            {/* Sizes */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">المقاسات</label>
                              <div className="space-y-2">
                                {newProduct.sizes.map((size, index) => (
                                  <input
                                    key={index}
                                    type="text"
                                    value={size}
                                    onChange={(e) => updateSizeField(index, e.target.value)}
                                    placeholder="المقاس"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
                                    dir="rtl"
                                  />
                                ))}
                                <button
                                  type="button"
                                  onClick={addSizeField}
                                  className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                                >
                                  + إضافة مقاس آخر
                                </button>
                              </div>
                            </div>

                            {/* Colors */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">الألوان</label>
                              <div className="space-y-2">
                                {newProduct.colors.map((color, index) => (
                                  <input
                                    key={index}
                                    type="text"
                                    value={color}
                                    onChange={(e) => updateColorField(index, e.target.value)}
                                    placeholder="اللون"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
                                    dir="rtl"
                                  />
                                ))}
                                <button
                                  type="button"
                                  onClick={addColorField}
                                  className="text-pink-600 hover:text-pink-700 text-sm font-medium"
                                >
                                  + إضافة لون آخر
                                </button>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                              <button
                                onClick={showAddProduct ? handleAddProduct : handleUpdateProduct}
                                disabled={isLoading || (newProduct.code && checkProductCodeExists(newProduct.code, editingProduct?.id))}
                                className="flex-1 bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                              >
                                {isLoading ? 'جاري المعالجة...' : (showAddProduct ? 'إضافة المنتج' : 'تحديث المنتج')}
                              </button>
                              <button
                                onClick={() => {
                                  setShowAddProduct(false);
                                  setShowEditProduct(false);
                                  setEditingProduct(null);
                                  resetProductForm();
                                }}
                                className="flex-1 sm:flex-none bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Products List */}
                      <div className="space-y-3 lg:space-y-4">
                        {isLoading && (
                          <div className="text-center py-8">
                            <p className="text-gray-600">جاري تحميل المنتجات...</p>
                          </div>
                        )}

                        {!isLoading && products.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-600">لا توجد منتجات متاحة</p>
                            <button
                              onClick={() => refreshProductsList(currentPage)}
                              className="mt-4 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                            >
                              إعادة التحميل
                            </button>
                          </div>
                        ) : (
                          products.map(product => {
                            // ❗ CHANGE: No fallback path specified. If images array is empty, mainImage will be undefined.
                            const mainImage = product.images.find(img => img.isMain)?.imagePath || product.images[0]?.imagePath; 
                            
                            // Determine product status based on new fields
                            const isHidden = product.isHidden;
                            const isAvailable = product.isAvailable;
                            const seasonText = getSeasonText(product.season);

                            return (
                              <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                <div className="flex flex-col sm:flex-row gap-4">
                                  {/* Product Image */}
                                  <div className="flex-shrink-0 relative">
                                    <img
                                      // ❗ CHANGE: If mainImage is undefined, the src attribute will be empty, showing the broken image icon immediately.
                                      src={mainImage}
                                      alt={product.name}
                                      className="w-full sm:w-20 lg:w-24 h-48 sm:h-20 lg:h-24 object-cover rounded-lg"
                                      onError={(e) => {
                                        console.error('Failed to load image for product', product.name, ':', e.currentTarget.src);
                                        // ❗ CHANGE: Do nothing here. The browser will show the broken image icon.
                                      }}
                                    />
                                    {/* Status Overlay for Hidden/Unavailable */}
                                    {isHidden && (
                                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg">
                                        <EyeOff size={24} className="text-white" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Product Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                      <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800 text-lg leading-tight">{product.name}</h3>
                                        <p className="text-sm text-gray-600 mt-1">كود: {product.code}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                          <p className="text-pink-600 font-bold text-lg">{product.price} جنيه</p>
                                          {product.originalPrice && (
                                            <p className="text-sm text-gray-500 line-through">{product.originalPrice} جنيه</p>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                            {product.category === 0 ? 'حريمي' : 'أطفال'}
                                          </span>

                                          {/* Display Season */}
                                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full flex items-center">
                                            <Zap size={12} className='ml-1' /> {seasonText}
                                          </span>

                                          {/* Display isHidden / isAvailable status */}
                                          <span className={`text-xs px-2 py-1 rounded-full flex items-center ${
                                            isAvailable ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            <Package size={12} className='ml-1' /> {isAvailable ? 'متاح' : 'غير متاح'}
                                          </span>
                                          <span className={`text-xs px-2 py-1 rounded-full flex items-center ${
                                            isHidden ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {isHidden ? <EyeOff size={12} className='ml-1' /> : <Eye size={12} className='ml-1' />}
                                            {isHidden ? 'مخفي' : 'مرئي'}
                                          </span>
                                        </div>
                                        {product.description && (
                                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
                                        )}
                                      </div>

                                      {/* Action Buttons */}
                                      <div className="flex sm:flex-col gap-2 sm:mr-4">
                                        <button
                                          onClick={() => handleEditProduct(product)}
                                          disabled={isLoading}
                                          className="flex-1 sm:flex-none bg-blue-50 text-blue-600 hover:bg-blue-100 p-3 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center"
                                          title="تعديل المنتج"
                                        >
                                          <Edit size={18} />
                                          <span className="mr-2 sm:hidden">تعديل</span>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteProduct(product.id)}
                                          disabled={isLoading}
                                          className="flex-1 sm:flex-none bg-red-50 text-red-600 hover:bg-red-100 p-3 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center"
                                          title="حذف المنتج"
                                        >
                                          <Trash2 size={18} />
                                          <span className="mr-2 sm:hidden">حذف</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex flex-col items-center mt-6 lg:mt-8 space-y-4">
                          {/* Mobile Pagination */}
                          <div className="flex items-center justify-between w-full sm:hidden">
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1 || isLoading}
                              className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronRight size={20} />
                              <span className="mr-2">السابق</span>
                            </button>

                            <div className="text-sm text-gray-600">
                              {currentPage} من {totalPages}
                            </div>

                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages || isLoading}
                              className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span className="ml-2">التالي</span>
                              <ChevronLeft size={20} />
                            </button>
                          </div>

                          {/* Desktop Pagination */}
                          <div className="hidden sm:flex justify-center items-center space-x-reverse space-x-2">
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1 || isLoading}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              السابق
                            </button>

                            <div className="flex items-center space-x-reverse space-x-1">
                              {/* Page buttons logic */}
                              {Array.from({ length: totalPages > 5 ? 5 : totalPages }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i;
                                } else {
                                  pageNum = currentPage - 2 + i;
                                }

                                // Boundary check for calculated pageNum
                                if (pageNum < 1 || pageNum > totalPages) return null;

                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    disabled={isLoading}
                                    className={`px-3 py-2 rounded-lg text-sm ${
                                      currentPage === pageNum
                                        ? 'bg-pink-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                      } disabled:opacity-50`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages || isLoading}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              التالي
                            </button>
                          </div>

                          <div className="text-center text-sm text-gray-500">
                            إجمالي المنتجات: {products.length} | الصفحة {currentPage} من {totalPages}
                          </div>
                        </div>
                      )}
                    </div>
                </div>
              </div>

              {/* Desktop Sidebar */}
              <div className="hidden lg:block lg:w-80">
                {/* Global Season Control added here */}
                <GlobalSeasonVisibilityControl />

                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6 mt-6"> {/* Added mt-6 for spacing */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">إحصائيات سريعة</h3>
                  <div className="space-y-4">
                    <div className="bg-pink-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">إجمالي المنتجات</p>
                      <p className="text-2xl font-bold text-pink-600">{products.length}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">منتجات حريمي</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {products.filter(p => p.category === 0).length}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">منتجات أطفال</p>
                      <p className="text-2xl font-bold text-green-600">
                        {products.filter(p => p.category === 1).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsManagement;