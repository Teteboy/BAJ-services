# BAJ Services - Fuel Order and Delivery Management Platform

A comprehensive web-based platform for managing fuel orders, deliveries, invoices, payments, and client relationships for BAJ Services. Built with modern web technologies to streamline business operations.

## 🚀 Features

### Admin Dashboard
- **Dashboard**: Overview of orders, deliveries, payments, and revenue metrics
- **Orders Management**: View, validate, modify, or reject client orders
- **Client Management**: Manage client accounts and pricing structures
- **Delivery Tracking**: Track and confirm fuel deliveries
- **Invoice Generation**: Automatic invoice creation and PDF generation
- **Payment Processing**: Record and track client payments
- **Stock Management**: Manage weekly fuel stock entries
- **Reports**: Generate weekly summary reports
- **User Management**: Admin user accounts and permissions

### Client Portal
- **Order Placement**: Place new fuel orders with delivery scheduling
- **Order Tracking**: View order status and history
- **Invoice Access**: View and download invoices
- **Profile Management**: Update account information

## 🛠 Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Server-side type safety
- **Prisma** - Database ORM
- **JWT** - Authentication
- **Nodemailer** - Email sending
- **PDFKit** - PDF generation

### Database
- **SQLite** (development) / **PostgreSQL** (production)

### DevOps
- **ngrok** - Local tunneling for testing

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Teteboy/BAJ-services.git
   cd baj-services
   ```

2. **Install dependencies**
   ```bash
   # Root dependencies
   npm install

   # Client dependencies
   cd client
   npm install
   cd ..

   # Server dependencies
   cd server
   npm install
   cd ..
   ```

3. **Set up the database**
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma generate
   npx prisma db seed
   ```

4. **Environment configuration**
   - Copy `.env.example` to `.env` in the server directory
   - Configure database connection, JWT secret, email settings, etc.

## 🚀 Running the Application

1. **Start the server**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the client** (in a new terminal)
   ```bash
   cd client
   npm run dev
   ```

3. **Access the application**
   - Admin: http://localhost:5173 (client)
   - API: http://localhost:3000 (server)

## 🧪 Testing

Refer to `TESTER_USER_MANUAL.md` for detailed testing instructions, including test accounts and scenarios.

### Test Accounts
- **Admin**: admin@bajservices.com / admin123
- **Client**: client@test.com / client123

## 📁 Project Structure

```
baj-services/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and API calls
│   │   └── ...
│   ├── vite.config.ts
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── lib/            # Utilities
│   │   └── ...
│   ├── prisma/             # Database schema and migrations
│   └── package.json
├── TESTER_USER_MANUAL.md   # Testing guide
└── README.md              # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software for BAJ Services.

## 📞 Support

For technical support or questions, please contact the development team.

---

**BAJ Services** - Streamlining fuel delivery operations since 2026.