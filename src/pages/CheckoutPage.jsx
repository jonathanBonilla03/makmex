import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { 
  checkExistingCustomer, 
  addCustomer, 
  checkRecentOrders, 
  checkDuplicateOrder, 
  createOrder 
} from "../lib/supabase";

export default function CheckoutPage() {
  const { t, formatPrice } = useLanguage();
  const { items, getCartTotal, clearCart, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields
    if (!formData.name || !formData.email) {
      alert(t('pleaseFillRequiredFields'));
      setIsSubmitting(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert(t('pleaseEnterValidEmail'));
      setIsSubmitting(false);
      return;
    }

    // Prepare customer data
    const customerData = {
      ...formData
    };

    try {
      // Check if customer already exists
      const existingCustomerResult = await checkExistingCustomer(formData.email, formData.phone_number);
      
      if (!existingCustomerResult.success) {
        alert(`Error checking customer: ${existingCustomerResult.error}`);
        return;
      }

      let customer;
      
      // If customer exists, use their existing record
      if (existingCustomerResult.data && existingCustomerResult.data.length > 0) {
        customer = existingCustomerResult.data[0];
        alert(`${t('welcomeBack')} ${customer.name}! ${t('foundExistingAccount')}`);
      } else {
        // Create new customer if they don't exist
        const customerResult = await addCustomer(customerData);
        
        if (!customerResult.success) {
          alert(`Error: ${customerResult.error}`);
          return;
        }
        customer = customerResult.data;
      }

      // Check for recent orders (spam protection - 3 orders per day)
      const recentOrderCheck = await checkRecentOrders(customer.id);
      if (!recentOrderCheck.success) {
        alert(`${t('errorCheckingOrderHistory')}: ${recentOrderCheck.error}`);
        return;
      }

      if (recentOrderCheck.hasExcessiveAttempts) {
        // Alert for 5+ order attempts
        alert(`${t('excessiveAttemptsWarning')} ${recentOrderCheck.orderCount} ${t('ordersToday')}. ${t('excessiveAttemptsMessage')}`);
        return;
      }

      if (recentOrderCheck.hasRecentOrder) {
        const orderTime = new Date(recentOrderCheck.recentOrderTime).toLocaleString();
        alert(`${t('alreadyPlacedOrder')} ${orderTime}. ${t('threeOrdersPerDay')}`);
        return;
      }

      // Check for duplicate order (same items, same total within last hour)
      const duplicateCheck = await checkDuplicateOrder(customer.id, items, getCartTotal());
      if (!duplicateCheck.success) {
        alert(`${t('errorCheckingDuplicates')}: ${duplicateCheck.error}`);
        return;
      }

      if (duplicateCheck.isDuplicate) {
        const orderTime = new Date(duplicateCheck.recentOrderTime).toLocaleString();
        alert(`${t('duplicateOrder')} ${orderTime}. ${t('checkEmailOrContact')}`);
        return;
      }

      // Create order
      const orderData = {
        customer_id: customer.id,
        status: 'pending',
        subtotal: getCartTotal(),
        total: getCartTotal(),
        tax: 0 // You can calculate tax later
      };

      console.log('Creating order with data:', orderData);
      console.log('Customer ID:', customer.id, 'Type:', typeof customer.id);
      console.log('Cart items:', items);

      const orderResult = await createOrder(orderData, items);
      
      if (orderResult.success) {
        // Clear cart after successful order
        clearCart();
        // Redirect to success page with order details
        navigate('/order-success', {
          state: {
            orderNumber: orderResult.data.order_number || 'N/A',
            orderDate: new Date().toLocaleDateString(),
            customerName: customer.name,
            customerEmail: customer.email,
            total: getCartTotal(),
            itemCount: items.length
          }
        });
      } else {
        alert(`${t('errorCreatingOrder')}: ${orderResult.error}`);
      }
    } catch (error) {
      alert(`${t('unexpectedError')}: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">{t('checkout')}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-makmex-text">{t('orderSummary')}</h2>
          
          {items.length === 0 ? (
            <p className="text-makmex-muted">{t('yourCartIsEmpty')}</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={`${item.id}-${item.type}`} className="p-4 border border-makmex-border rounded-lg bg-makmex-surface">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                    <h3 className="font-medium text-makmex-text">{item.name}</h3>
                    <p className="text-sm text-makmex-muted">{t('sku')}: {item.display_sku || item.sku}</p>
                      <p className="text-sm text-makmex-muted">{formatPrice(item.price)} {t('each')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id, item.type)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)}
                        className="w-7 h-7 rounded bg-makmex-border text-makmex-text hover:bg-makmex-orange"
                      >
                        −
                      </button>
                      <span className="text-sm w-8 text-center text-makmex-text">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.quantity < item.available_quantity) {
                            updateQuantity(item.id, item.type, item.quantity + 1);
                          }
                        }}
                        className="w-7 h-7 rounded bg-makmex-border text-makmex-text hover:bg-makmex-orange disabled:opacity-50"
                        disabled={item.quantity >= item.available_quantity}
                      >
                        +
                      </button>
                    </div>

                    <p className="font-medium text-makmex-text">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
              
              <div className="border-t border-makmex-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-makmex-text">{t('total')}:</span>
                  <span className="text-lg font-bold text-makmex-text">{formatPrice(getCartTotal())}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Checkout Form */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-makmex-text">{t('shippingInformation')}</h2>
          
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>{t('important')}:</strong> {t('securityNotice')}
            </p>
          </div>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-2 text-makmex-text">{t('fullName')}</label>
              <input 
                type="text" 
                className="w-full p-3 border border-makmex-border rounded-lg bg-makmex-surface text-makmex-text focus:outline-none focus:border-makmex-orange"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-makmex-text">{t('email')}</label>
              <input 
                type="email" 
                className="w-full p-3 border border-makmex-border rounded-lg bg-makmex-surface text-makmex-text focus:outline-none focus:border-makmex-orange"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-makmex-text">{t('phoneNumber')}</label>
              <input 
                type="tel" 
                className="w-full p-3 border border-makmex-border rounded-lg bg-makmex-surface text-makmex-text focus:outline-none focus:border-makmex-orange"
                placeholder="(555) 123-4567"
                value={formData.phone_number}
                onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
              />
            </div>
            
            <button 
              type="submit"
              className="w-full bg-makmex-orange text-black font-semibold py-3 rounded-lg hover:bg-makmex-ember transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('placingOrder') : t('placeOrder')}
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-makmex-surface border border-makmex-border rounded-lg">
            <p className="text-sm text-makmex-muted">
              <strong>{t('questionsOrIssues')}</strong> {t('contactUsAt')} 
              <a href="mailto:test@gmail.com" className="text-makmex-orange hover:underline ml-1">
                test@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
