# PANDAS Autoimmune Tracker

A comprehensive medical tracking application specifically designed for parents and caregivers of children with PANDAS (Pediatric Autoimmune Neuropsychiatric Disorders Associated with Streptococcal Infections) and PANS (Pediatric Acute-onset Neuropsychiatric Syndrome) conditions.

## 🏥 About

The PANDAS Autoimmune Tracker serves as your family's **independent medical data headquarters**—completely separate from any hospital system, insurance company, or healthcare network. This ensures your child's complete medical story belongs to YOU and travels with you through all healthcare changes.

### Key Features

- **🔒 Healthcare Independence**: Your neutral platform outside any specific medical system
- **📊 Advanced Analytics**: Pattern recognition across all treatments and providers
- **👨‍👩‍👧‍👦 Family Collaboration**: Multi-user access with role-based permissions
- **🛡️ Privacy First**: Bank-level encryption and HIPAA compliance
- **📱 Mobile-First Design**: Optimized for real-time tracking on any device
- **🔗 Universal Provider Integration**: Works with ANY healthcare provider

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Firebase account for backend services

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd pandas-autoimmune-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

Create a `.env.local` file with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev              # Start development server on port 8080
npm run build           # Production build
npm run build:dev       # Development build
npm run preview         # Preview production build
npm run lint            # Run ESLint
npm run test            # Run tests
npm run test:watch      # Run tests in watch mode
```

### Technology Stack

- **React 18** with TypeScript
- **Vite** as build tool and dev server
- **Firebase** for backend services (Firestore, Authentication, Storage)
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for styling
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Recharts** for data visualization

## 🔒 Security & Privacy

### Security Features

- End-to-end encryption for sensitive medical data
- HIPAA compliance with comprehensive audit logging
- Two-factor authentication support
- Secure session management
- Regular security audits and monitoring

### Privacy Controls

- Granular permission system for family members
- Child-specific privacy settings
- Data retention and deletion controls
- Consent management for research participation
- Complete audit trail of all data access

## 📖 Documentation

For comprehensive documentation, see [PANDAS_TRACKER_GUIDE.md](./PANDAS_TRACKER_GUIDE.md) which includes:

- Complete user guide for non-technical users
- Technical deployment instructions
- Feature explanations and best practices
- Privacy and security guidance
- Troubleshooting and support information

## 🚀 Deployment

### Firebase Deployment

1. **Set up Firebase project** with Authentication, Firestore, and Hosting
2. **Configure security rules** for Firestore and Storage
3. **Build the application** for production
4. **Deploy to Firebase Hosting**

Detailed deployment instructions are available in the [deployment guide](./PANDAS_TRACKER_GUIDE.md#technical-deployment-guide).

### Production Checklist

- [ ] Firebase project configured with proper security rules
- [ ] Environment variables set for production
- [ ] SSL certificate configured (automatic with Firebase)
- [ ] Security headers configured
- [ ] Monitoring and alerting set up
- [ ] Backup procedures established

## 🤝 Contributing

This project follows security-first development practices:

1. All medical data handling must be HIPAA compliant
2. Privacy settings must be thoroughly tested
3. Security reviews required for all authentication/authorization changes
4. Property-based testing for critical privacy functions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Email Support**: support@pandas-tracker.com
- **Privacy Questions**: privacy@pandas-tracker.com
- **Security Issues**: security@pandas-tracker.com
- **Documentation**: [Complete User Guide](./PANDAS_TRACKER_GUIDE.md)

## ⚠️ Medical Disclaimer

This application is a tracking and organizational tool only. It is not intended to diagnose medical conditions, replace professional medical advice, or provide treatment recommendations. Always consult with qualified healthcare professionals for medical diagnosis and treatment decisions.

---

**Your child's medical story belongs to YOU** - not to any hospital, insurance company, or healthcare system. This app ensures that story stays complete, accessible, and under your control.
