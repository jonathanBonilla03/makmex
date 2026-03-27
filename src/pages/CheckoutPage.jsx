import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { addCustomer, checkExistingCustomer, createOrder, checkRecentOrders, checkDuplicateOrder } from "../lib/supabase";

export default function CheckoutPage() {
  const { t } = useLanguage();
  const { items, getCartTotal, clearCart } = useCart();
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
      alert('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
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
        alert(`Welcome back, ${customer.name}! We found your existing account.`);
      } else {
        // Create new customer if they don't exist
        const customerResult = await addCustomer(customerData);
        
        if (!customerResult.success) {
          alert(`Error: ${customerResult.error}`);
          return;
        }
        customer = customerResult.data;
      }

      // Check for recent orders (spam protection - 1 order per day)
      const recentOrderCheck = await checkRecentOrders(customer.id);
      if (!recentOrderCheck.success) {
        alert(`Error checking order history: ${recentOrderCheck.error}`);
        return;
      }

      if (recentOrderCheck.hasRecentOrder) {
        const orderTime = new Date(recentOrderCheck.recentOrderTime).toLocaleString();
        alert(`You have already placed an order on ${orderTime}. For security reasons, you can only place one order per day. Please try again tomorrow.`);
        return;
      }

      // Check for duplicate order (same items, same total within last hour)
      const duplicateCheck = await checkDuplicateOrder(customer.id, items, getCartTotal());
      if (!duplicateCheck.success) {
        alert(`Error checking for duplicate orders: ${duplicateCheck.error}`);
        return;
      }

      if (duplicateCheck.isDuplicate) {
        const orderTime = new Date(duplicateCheck.recentOrderTime).toLocaleString();
        alert(`It appears you already placed this same order at ${orderTime}. Please check your email for order confirmation or contact us if you need assistance.`);
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
        // Redirect to success page
        navigate('/order-success');
      } else {
        alert(`Error creating order: ${orderResult.error}`);
      }
    } catch (error) {
      alert(`Unexpected error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-makmex-text">Order Summary</h2>
          
          {items.length === 0 ? (
            <p className="text-makmex-muted">Your cart is empty</p>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-4 border border-makmex-border rounded-lg bg-makmex-surface">
                  <div>
                    <h3 className="font-medium text-makmex-text">{item.description}</h3>
                    <p className="text-sm text-makmex-muted">SKU: {item.display_sku || item.sku}</p>
                    <p className="text-sm text-makmex-muted">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-makmex-text">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              
              <div className="border-t border-makmex-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-makmex-text">Total:</span>
                  <span className="text-lg font-bold text-makmex-text">${getCartTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Checkout Form */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-makmex-text">Shipping Information</h2>
          
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> For security reasons, customers are limited to one order per day. 
              Please ensure all items in your cart are correct before placing your order.
            </p>
          </div>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-2 text-makmex-text">Full Name</label>
              <input 
                type="text" 
                className="w-full p-3 border border-makmex-border rounded-lg bg-makmex-surface text-makmex-text focus:outline-none focus:border-makmex-orange"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-makmex-text">Email</label>
              <input 
                type="email" 
                className="w-full p-3 border border-makmex-border rounded-lg bg-makmex-surface text-makmex-text focus:outline-none focus:border-makmex-orange"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-makmex-text">Phone Number (Optional)</label>
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
              {isSubmitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-makmex-surface border border-makmex-border rounded-lg">
            <p className="text-sm text-makmex-muted">
              <strong>Questions or Issues?</strong> Contact us at 
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
