# BAJ Services - Tester User Manual

Welcome to BAJ Services! This manual will help you test the fuel order and delivery management platform.

---

## 🔗 Application URL

**Live Test URL**: https://elle-subcultural-vainly.ngrok-free.dev

> **Note**: This is a test environment. Data may be reset periodically.

---

## 👤 Test Accounts

### Admin Account
| Field | Value |
|-------|-------|
| Email | admin@bajservices.com |
| Password | admin123 |

### Client Account
| Field | Value |
|-------|-------|
| Email | client@test.com |
| Password | client123 |

---

## 🚀 Getting Started

1. Open the application URL in your browser
2. Login with one of the test accounts above
3. Explore the dashboard and features

---

## 📱 Features Overview

### For Admin Users

After logging in with the admin account, you can access:

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview of orders, deliveries, payments, and revenue |
| **Orders** | View and manage all client orders (validate, modify, reject) |
| **Clients** | Manage client accounts and their pricing |
| **Deliveries** | Track and confirm deliveries |
| **Invoices** | View generated invoices |
| **Payments** | Record and track payments |
| **Stock** | Manage weekly fuel stock entries |
| **Reports** | View weekly summary reports |

### For Client Users

After logging in with a client account, you can access:

| Feature | Description |
|---------|-------------|
| **Dashboard** | Your order statistics and recent activity |
| **Orders** | View your orders and their status |
| **New Order** | Place a new fuel order |
| **Invoices** | View and download your invoices |

---

## 🧪 Testing Guide

### Test Scenario 1: Client Places an Order

1. Login as a client (client@test.com / client123)
2. Go to **New Order**
3. Select a delivery location
4. Choose a delivery date (must be at least 48 hours from now)
5. Add products and quantities
6. Submit the order
7. The order will appear as **PENDING**

### Test Scenario 2: Admin Validates an Order

1. Login as admin (admin@bajservices.com / admin123)
2. Go to **Orders**
3. Find a pending order from a client
4. Click to view order details
5. Click **Validate** to approve the order
6. The status changes to **VALIDATED**

### Test Scenario 3: Admin Confirms Delivery

1. Login as admin
2. Go to **Orders**
3. Find a validated order
4. Click **Confirm Delivery**
5. This will:
   - Mark the order as **DELIVERED**
   - Generate an invoice
   - Send an email notification to the client (if SMTP is configured)

### Test Scenario 4: Client Views Invoice

1. Login as a client
2. Go to **Invoices**
3. View invoice details and download PDF

---

## 📝 Sample Test Data

### Products Available
- Diesel
- Petrol
- Lubricants

### Payment Terms Options
- Immediate
- 10 Days
- 15 Days
- 30 Days

### Order Status Flow
```
PENDING → VALIDATED → DELIVERED
    ↓          ↓
 REJECTED   MODIFIED
```

---

## ⚠️ Known Limitations (Test Environment)

1. **Email**: Email sending may fail if SMTP is not properly configured. This is expected in the test environment.

2. **Data Persistence**: Test data may be cleared periodically.

3. **PDF Generation**: Invoices generate PDFs that are stored on the server.

---

## 🐛 Reporting Issues

If you encounter any bugs or issues, please document:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots (if applicable)

---

## 📧 Support

For technical questions, contact the development team.

---

*Document Version: 1.0*  
*Last Updated: March 2026*
