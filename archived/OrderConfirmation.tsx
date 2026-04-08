import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Hr,
  Button,
} from "@react-email/components";

type Item = {
  name: string;
  quantity: number;
  price: number;
  sku?: string;
  type: string;
};

type Props = {
  customerName: string;
  orderNumber: string;
  items: Item[];
  total: number;
  customerEmail: string;
};

export default function OrderConfirmationEmail({
  customerName,
  orderNumber,
  items,
  total,
  customerEmail,
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f4', margin: 0, padding: 20 }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <Heading style={{ color: '#333333', textAlign: 'center', marginBottom: '20px' }}>
            Order Confirmation
          </Heading>
          
          <Text style={{ fontSize: '16px', lineHeight: '1.5', color: '#555555' }}>
            Hi {customerName},
          </Text>
          
          <Text style={{ fontSize: '16px', lineHeight: '1.5', color: '#555555' }}>
            Thank you for your order! Your order has been received and is being processed.
          </Text>
          
          <Section style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '6px', margin: '20px 0' }}>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#333333', marginBottom: '10px' }}>
              Order #{orderNumber}
            </Text>
            <Text style={{ fontSize: '14px', color: '#666666', marginBottom: '5px' }}>
              Email: {customerEmail}
            </Text>
            <Text style={{ fontSize: '14px', color: '#666666' }}>
              Date: {new Date().toLocaleDateString()}
            </Text>
          </Section>

          <Heading style={{ fontSize: '18px', color: '#333333', marginBottom: '15px' }}>
            Order Details
          </Heading>
          
          <Section style={{ marginBottom: '20px' }}>
            {items.map((item, i) => (
              <div key={i} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: i < items.length - 1 ? '1px solid #eeeeee' : 'none' }}>
                <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#333333', margin: '0 0 5px 0' }}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: '14px', color: '#666666', margin: '0 0 5px 0' }}>
                  SKU: {item.sku || 'N/A'} | Type: {item.type}
                </Text>
                <Text style={{ fontSize: '14px', color: '#666666', margin: '0' }}>
                  Quantity: {item.quantity} × ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}
                </Text>
              </div>
            ))}
          </Section>

          <Hr style={{ border: 'none', borderTop: '2px solid #333333', margin: '20px 0' }} />

          <Section style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#333333' }}>
              Total: ${total.toFixed(2)}
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', marginTop: '30px' }}>
            <Text style={{ fontSize: '14px', color: '#666666', marginBottom: '15px' }}>
              We'll send another email when your order status changes.
            </Text>
            <Button 
              style={{ 
                backgroundColor: '#ff6b35', 
                color: '#000000', 
                padding: '12px 24px', 
                textDecoration: 'none', 
                borderRadius: '6px', 
                fontWeight: 'bold',
                display: 'inline-block'
              }}
              href="mailto:support@makmex.com"
            >
              Contact Support
            </Button>
          </Section>

          <Section style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eeeeee' }}>
            <Text style={{ fontSize: '12px', color: '#999999', textAlign: 'center' }}>
              This is an automated message. Please do not reply to this email.
            </Text>
            <Text style={{ fontSize: '12px', color: '#999999', textAlign: 'center', marginTop: '5px' }}>
              © 2024 Makmex. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
