# 🎟️ AccessGate — Event Ticketing & Verification System

AccessGate is a modern, secure event ticketing platform built with **Next.js 14** (App Router) that provides comprehensive event management, ticketing, and real-time validation capabilities.

## 🚀 Key Features

### 🎫 Ticketing & Event Management
- **Event Creation & Management** - Create events with multiple ticket types, pricing, and capacity
- **Smart Ticket Generation** - Generate unique ticket codes with QR codes for secure validation
- **Real-time Availability** - Live ticket inventory tracking with sold-out prevention
- **Batch Ticket Creation** - Create multiple tickets for events with automated email delivery

### 🔐 Security & Authentication
- **JWT-based Authentication** - Secure token-based authentication system
- **Role-based Access Control** - Admin-level access control for event management
- **Registration Key System** - Secure admin registration with invitation keys
- **Password Hashing** - bcrypt for secure password storage

### 📊 Analytics & Reporting
- **Real-time Dashboard** - Comprehensive event statistics and revenue tracking
- **Check-in Analytics** - Live check-in rates and attendance metrics
- **Revenue Reporting** - Total revenue calculation across all events
- **Ticket Sales Tracking** - Real-time sales data per ticket type

### 🎯 Validation & Check-in
- **QR Code Validation** - Secure ticket validation using unique QR codes
- **Real-time Check-in** - Instant ticket validation with duplicate prevention
- **Multi-format Support** - Support for manual code entry and QR scanning
- **Check-in Audit Trail** - Complete history of all validations

## 🛠 Tech Stack

**Frontend & Backend**
- **Next.js 14** - App Router with TypeScript for full-stack development
- **React 18** - Modern React with hooks and functional components
- **MongoDB with Mongoose** - Database with object modeling
- **JWT** - JSON Web Tokens for secure authentication

**Development & Deployment**
- **TypeScript** - Type-safe development
- **Axios** - HTTP client for API communication
- **Vercel** - Recommended deployment platform

## 📁 Project Structure

```
accessgate/
├── app/                    # Next.js App Router
│   ├── api/               # API Route Handlers
│   │   ├── admin/         # Admin management endpoints
│   │   ├── auth/          # Authentication endpoints
│   │   ├── events/        # Event management endpoints
│   │   └── tickets/       # Ticket operations endpoints
│   ├── docs/              # API documentation (Swagger UI)
│   └── ...               # Other app routes
├── app/api/models/        # MongoDB Mongoose models
│   ├── Admin.ts          # Admin user model
│   ├── Event.ts          # Event and ticket types model
│   └── Ticket.ts         # Ticket model
├── lib/                  # Shared utilities
│   ├── auth.ts          # Authentication helpers
│   ├── db.ts            # Database connection
│   ├── email.ts         # Email service
│   └── qrcode.ts        # QR code generation
├── public/              # Static assets
│   └── openapi.yaml    # API documentation
└── ...                 # Configuration files
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ LTS
- npm, yarn, or pnpm
- MongoDB (Atlas recommended for production)

### 1. Clone the Repository
```bash
git clone https://github.com/azeezwaris17/access-gate.git
cd access-gate
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Configuration
Create `.env.local` file in the project root:

```env
# MongoDB Connection
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/accessgate?retryWrites=true&w=majority"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key-here"

# Application Settings
NEXT_PUBLIC_APP_NAME="AccessGate"
NEXT_PUBLIC_API_URL="/api"

# Email Service (Optional)
EMAIL_SERVICE_API_KEY="your-email-service-key"
```

### 4. Database Setup
The application will automatically create necessary collections when you first run it. For initial admin access, you'll need to use the registration key system.

### 5. Install Documentation Dependencies
```bash
npm install swagger-ui-react swagger-ui-dist
```

### 6. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Access API Documentation
Visit [http://localhost:3000/docs](http://localhost:3000/docs) to explore the complete API documentation.

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin with registration key
- `POST /api/auth/login` - Admin login

### Admin Management
- `GET /api/admin/keys` - Get all registration keys
- `POST /api/admin/keys` - Generate new registration key

### Event Management
- `GET /api/events` - Get all events with filtering and pagination
- `POST /api/events/create-event` - Create new event
- `GET /api/events/{eventId}` - Get specific event details
- `PUT /api/events/{eventId}/edit-event` - Update event details
- `PATCH /api/events/{eventId}/update-event-status` - Update event status

### Ticket Operations
- `POST /api/events/{eventId}/create-ticket` - Create ticket for event
- `POST /api/tickets/buy-ticket` - Purchase ticket (public endpoint)
- `POST /api/tickets/check-in` - Check in ticket
- `POST /api/tickets/validate-ticket-by-code` - Validate ticket

### Analytics
- `GET /api/events/analytics` - Get comprehensive analytics
- `GET /api/events/get-events-stat` - Get events statistics
- `GET /api/events/search-event` - Search events

## 🔐 Authentication Flow

1. **Admin Registration**: Requires valid registration key from existing admin
2. **Login**: Email and password authentication returning JWT token
3. **Protected Routes**: Include `Authorization: Bearer <token>` header
4. **Token Verification**: Automatic token validation for all protected endpoints

## 🎫 Ticket Generation & Validation

### Ticket Creation
- Unique ticket codes generated in format: `AG-timestamp-randomHex`
- QR codes generated for each ticket
- Automatic email delivery to attendees
- Real-time inventory tracking

### Ticket Validation
- QR code or manual code validation
- Duplicate check-in prevention
- Real-time status updates
- Comprehensive audit trail

## 📊 Analytics Features

### Event Statistics
- Total revenue calculation
- Ticket sales per type
- Check-in rates and attendance
- Available ticket counts

### Real-time Dashboard
- Live event status tracking
- Revenue analytics
- Attendance metrics
- Performance insights

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on git push

### Environment Variables for Production
```env
MONGODB_URI="your-production-mongodb-uri"
JWT_SECRET="your-production-jwt-secret"
NEXTAUTH_URL="https://yourdomain.com"
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📚 API Documentation

The complete API documentation is available at `/docs` endpoint and includes:
- Interactive Swagger UI
- Request/response examples
- Authentication requirements
- Error code documentation
- Live testing capability

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Visit `/docs` for API documentation
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Email**: azeezwaris17@gmail.com

## 📞 Contact

**Azeez Waris**  
- Email: azeezwaris17@gmail.com  
- GitHub: [@azeezwaris17](https://github.com/azeezwaris17)  
- Project Repository: [AccessGate](https://github.com/azeezwaris17/access-gate)

---

**AccessGate** - Modern event ticketing made simple. Built with ❤️ using Next.js and MongoDB.