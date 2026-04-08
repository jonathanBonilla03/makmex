// Simple email confirmation using browser's mailto
export const sendOrderConfirmationEmail = (orderDetails, customerInfo, items) => {
  const { id, total, created_at } = orderDetails;
  const { name, email, phone_number } = customerInfo;
  
  const orderNumber = id.toString().substring(0, 8).toUpperCase();
  const orderDate = new Date(created_at).toLocaleDateString();
  
  // Create email body
  const emailBody = `
ORDER CONFIRMATION
==================

Order Number: ${orderNumber}
Order Date: ${orderDate}
Status: Pending

CUSTOMER INFORMATION
===================
Name: ${name}
Email: ${email}
Phone: ${phone_number || 'Not provided'}

ORDER ITEMS
===========
${items.map((item, index) => `
${index + 1}. ${item.name}
   SKU: ${item.sku || 'N/A'}
   Type: ${item.type}
   Quantity: ${item.quantity}
   Price: $${item.price.toFixed(2)}
   Subtotal: $${(item.quantity * item.price).toFixed(2)}
`).join('')}

ORDER TOTAL
===========
Total: $${total.toFixed(2)}

NEXT STEPS
==========
- Your order has been received and is being processed
- We'll send updates when your order status changes
- If you have questions, reply to this email or contact us at support@makmex.com

Thank you for your order!
  `.trim();

  // Create mailto link
  const subject = `Order Confirmation #${orderNumber}`;
  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
  
  // Open email client
  window.open(mailtoLink, '_blank');
  
  // Also send internal notification
  const internalEmailBody = `
NEW ORDER NOTIFICATION
=====================

Order Number: ${orderNumber}
Order Date: ${orderDate}
Customer: ${name} (${email})
Phone: ${phone_number || 'Not provided'}
Total: $${total.toFixed(2)}
Items: ${items.length}

View order details in the admin dashboard.
  `.trim();
  
  const internalSubject = `New Order #${orderNumber} - ${name}`;
  const internalMailto = `mailto:ekaustinen@my.gcu.edu?subject=${encodeURIComponent(internalSubject)}&body=${encodeURIComponent(internalEmailBody)}`;
  
  // Open internal email (optional - can be removed if not needed)
  setTimeout(() => {
    window.open(internalMailto, '_blank');
  }, 1000);
};

export const formatOrderItems = (cartItems) => {
  return cartItems.map(item => ({
    name: item.name || item.product_name || 'Unknown Item',
    sku: item.sku || item.product_sku || 'N/A',
    type: item.type || 'Product',
    quantity: item.quantity || 1,
    price: item.price || item.unit_price || 0
  }));
};
