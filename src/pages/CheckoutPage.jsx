import React, { useState } from 'react';
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { addCustomer, checkExistingCustomer } from "../lib/supabase";

export default function CheckoutPage() {
  const { t } = useLanguage();
  const { items, getCartTotal } = useCart();
  const [country, setCountry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
    state: '',
    zip_code: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields
    if (!formData.name || !formData.email || !formData.address || !formData.city || !country || !formData.zip_code) {
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
      ...formData,
      country: country,
      state: country === 'Mexico' || country === 'United States' ? formData.state : null
    };

    try {
      // Check if customer already exists
      const existingCustomerResult = await checkExistingCustomer(formData.email, formData.phone_number);
      
      if (!existingCustomerResult.success) {
        alert(`Error checking customer: ${existingCustomerResult.error}`);
        return;
      }

      // If customer exists, use their existing record
      if (existingCustomerResult.data && existingCustomerResult.data.length > 0) {
        const existingCustomer = existingCustomerResult.data[0];
        alert(`Welcome back, ${existingCustomer.name}! We found your existing account.`);
        // You could update their information here if needed
        setIsSubmitting(false);
        return;
      }

      // Create new customer if they don't exist
      const result = await addCustomer(customerData);
      
      if (result.success) {
        alert(`Order placed successfully! Thank you for your purchase.`);
        // You could also clear the cart here if needed
        // clearCart();
        // Navigate to a success page
      } else {
        alert(`Error: ${result.error}`);
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
                    <h3 className="font-medium text-makmex-text">{item.name}</h3>
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
            
            <div>
              <label className="block text-sm font-medium mb-2 text-makmex-text">Address</label>
              <input 
                type="text" 
                className="w-full p-3 border border-makmex-border rounded-lg bg-makmex-surface text-makmex-text focus:outline-none focus:border-makmex-orange"
                placeholder="123 Main St"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-makmex-text">City</label>
              <input 
                type="text" 
                className="w-full p-3 border border-makmex-border rounded-lg bg-makmex-surface text-makmex-text focus:outline-none focus:border-makmex-orange"
                placeholder="New York"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-makmex-text">Country</label>
              <select 
                className="w-full p-3 border border-makmex-border rounded-lg bg-makmex-surface text-makmex-text focus:outline-none focus:border-makmex-orange"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setFormData({...formData, state: ''});
                }}
              >
                <option value="">Select a country</option>
                <option value="United States">United States</option>
                <option value="Mexico">Mexico</option>
              </select>
            </div>
            
            {(country === 'United States' || country === 'Mexico') && (
              <div>
                <label className="block text-sm font-medium mb-2 text-makmex-text">State</label>
                <select 
                  className="w-full p-3 border border-makmex-border rounded-lg bg-makmex-surface text-makmex-text focus:outline-none focus:border-makmex-orange"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                >
                  <option value="">Select a state</option>
                  {country === 'United States' ? (
                    <>
                      <option value="AL">Alabama</option>
                      <option value="AK">Alaska</option>
                      <option value="AZ">Arizona</option>
                      <option value="AR">Arkansas</option>
                      <option value="CA">California</option>
                      <option value="CO">Colorado</option>
                      <option value="CT">Connecticut</option>
                      <option value="DE">Delaware</option>
                      <option value="FL">Florida</option>
                      <option value="GA">Georgia</option>
                      <option value="HI">Hawaii</option>
                      <option value="ID">Idaho</option>
                      <option value="IL">Illinois</option>
                      <option value="IN">Indiana</option>
                      <option value="IA">Iowa</option>
                      <option value="KS">Kansas</option>
                      <option value="KY">Kentucky</option>
                      <option value="LA">Louisiana</option>
                      <option value="ME">Maine</option>
                      <option value="MD">Maryland</option>
                      <option value="MA">Massachusetts</option>
                      <option value="MI">Michigan</option>
                      <option value="MN">Minnesota</option>
                      <option value="MS">Mississippi</option>
                      <option value="MO">Missouri</option>
                      <option value="MT">Montana</option>
                      <option value="NE">Nebraska</option>
                      <option value="NV">Nevada</option>
                      <option value="NH">New Hampshire</option>
                      <option value="NJ">New Jersey</option>
                      <option value="NM">New Mexico</option>
                      <option value="NY">New York</option>
                      <option value="NC">North Carolina</option>
                      <option value="ND">North Dakota</option>
                      <option value="OH">Ohio</option>
                      <option value="OK">Oklahoma</option>
                      <option value="OR">Oregon</option>
                      <option value="PA">Pennsylvania</option>
                      <option value="RI">Rhode Island</option>
                      <option value="SC">South Carolina</option>
                      <option value="SD">South Dakota</option>
                      <option value="TN">Tennessee</option>
                      <option value="TX">Texas</option>
                      <option value="UT">Utah</option>
                      <option value="VT">Vermont</option>
                      <option value="VA">Virginia</option>
                      <option value="WA">Washington</option>
                      <option value="WV">West Virginia</option>
                      <option value="WI">Wisconsin</option>
                      <option value="WY">Wyoming</option>
                    </>
                  ) : (
                    <>
                      <option value="AGU">Aguascalientes</option>
                      <option value="BCN">Baja California</option>
                      <option value="BCS">Baja California Sur</option>
                      <option value="CAM">Campeche</option>
                      <option value="CHP">Chiapas</option>
                      <option value="CHH">Chihuahua</option>
                      <option value="COA">Coahuila</option>
                      <option value="COL">Colima</option>
                      <option value="DUR">Durango</option>
                      <option value="GUA">Guanajuato</option>
                      <option value="GRO">Guerrero</option>
                      <option value="HID">Hidalgo</option>
                      <option value="JAL">Jalisco</option>
                      <option value="MEX">México</option>
                      <option value="MIC">Michoacán</option>
                      <option value="MOR">Morelos</option>
                      <option value="NAY">Nayarit</option>
                      <option value="NLE">Nuevo León</option>
                      <option value="OAX">Oaxaca</option>
                      <option value="PUE">Puebla</option>
                      <option value="QUE">Querétaro</option>
                      <option value="ROO">Quintana Roo</option>
                      <option value="SLP">San Luis Potosí</option>
                      <option value="SIN">Sinaloa</option>
                      <option value="SON">Sonora</option>
                      <option value="TAB">Tabasco</option>
                      <option value="TAM">Tamaulipas</option>
                      <option value="TLA">Tlaxcala</option>
                      <option value="VER">Veracruz</option>
                      <option value="YUC">Yucatán</option>
                      <option value="ZAC">Zacatecas</option>
                    </>
                  )}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2 text-makmex-text">ZIP Code</label>
              <input 
                type="text" 
                className="w-full p-3 border border-makmex-border rounded-lg bg-makmex-surface text-makmex-text focus:outline-none focus:border-makmex-orange"
                placeholder="10001"
                value={formData.zip_code}
                onChange={(e) => setFormData({...formData, zip_code: e.target.value})}
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
