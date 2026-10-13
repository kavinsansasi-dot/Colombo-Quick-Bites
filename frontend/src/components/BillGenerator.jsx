import React from 'react';
import { useOrder } from '../context/OrderContext';

const BillGenerator = ({ order, onClose }) => {
  const { orderStatuses } = useOrder();
  
  if (!order) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const downloadPDF = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Bill - ${order.id}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .customer-info {
            margin-bottom: 20px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            color: #F97316;
            margin-bottom: 10px;
          }
          .order-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .customer-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          .items-table th {
            background: #F97316;
            color: white;
            font-weight: bold;
          }
          .total-section {
            text-align: right;
            margin-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 18px;
          }
          .grand-total {
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Quick Bites - Order Bill</h1>
          <h2>Order ID: ${order.id}</h2>
          <p>Date: ${formatDate(order.createdAt)}</p>
        </div>

        <div class="customer-info">
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> ${order.customerInfo.name}</p>
          <p><strong>Phone:</strong> ${order.customerInfo.phone}</p>
          <p><strong>Address:</strong> ${order.customerInfo.address}</p>
          ${order.customerInfo.email ? `<p><strong>Email:</strong> ${order.customerInfo.email}</p>` : ''}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>Rs. ${item.price.toFixed(2)}</td>
                <td>Rs. ${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          ${order.subtotal ? `
            <p><strong>Subtotal:</strong> Rs. ${order.subtotal.toFixed(2)}</p>
            <p><strong>Delivery Fee:</strong> Rs. ${order.deliveryFee.toFixed(2)}</p>
          ` : ''}
          <h3><strong>Total Amount:</strong> Rs. ${order.totalAmount.toFixed(2)}</h3>
          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
        </div>

        <div class="footer">
          <p>Thank you for ordering from Quick Bites!</p>
          <p>For any inquiries, please call: ${order.customerInfo.phone}</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(billHTML);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Order Bill</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Order Header */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quick Bites</h3>
                <p className="text-sm text-gray-600">Food Delivery Service</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Order ID:</p>
                <p className="text-xl font-bold text-orange-600">{order.id}</p>
                <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Name:</span>
                  <span className="ml-2">{order.customerInfo.name}</span>
                </div>
                <div>
                  <span className="font-medium">Phone:</span>
                  <span className="ml-2">{order.customerInfo.phone}</span>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{order.customerInfo.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">Address:</span>
                  <span className="ml-2">{order.customerInfo.address}</span>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Payment Method:</span>
                  <span className="ml-2">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Payment Status:</span>
                  <span className="ml-2">{order.paymentStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Order Status:</span>
                  <span className="ml-2">{order.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Order Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">Rs. {item.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">Rs. {item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <th colSpan="3" className="px-4 py-3 text-sm font-medium text-gray-900">Subtotal</th>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {order.subtotal ? `Rs. ${order.subtotal.toFixed(2)}` : `Rs. ${order.totalAmount.toFixed(2)}`}
                    </td>
                  </tr>
                  {order.deliveryFee && (
                    <tr>
                      <th colSpan="3" className="px-4 py-3 text-sm font-medium text-gray-900">Delivery Fee</th>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">Rs. {order.deliveryFee.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <th colSpan="3" className="px-4 py-3 text-sm font-medium text-gray-900">Total Amount</th>
                    <td className="px-4 py-3 text-lg font-bold text-orange-600">Rs. {order.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={downloadPDF}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-6 6m6-6v6m0 0l6-6" />
              </svg>
              Download / Print Bill
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillGenerator;
