# Technology Stack

## Core Framework
- **React 18** with TypeScript
- **Vite** as build tool and dev server
- **React Router DOM** for client-side routing

## UI Framework
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for styling with custom design system
- **Lucide React** for icons
- **next-themes** for dark/light mode support

## State Management & Data
- **React Context** for global state (AuthContext, AppContext)
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation for forms
- **Firebase** for backend services (Firestore, Authentication, Storage)

## Key Libraries
- **Recharts** for data visualization and charts
- **date-fns** for date manipulation
- **crypto-js** for client-side encryption
- **jsPDF** and **docx** for document generation
- **file-saver** for file downloads

## Development Tools
- **ESLint** with TypeScript support
- **PostCSS** with Autoprefixer
- **SWC** for fast compilation

## Common Commands

```bash
# Development
npm run dev              # Start dev server on port 8080

# Building
npm run build           # Production build
npm run build:dev       # Development build
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
```

## Configuration Notes
- Path aliases configured: `@/*` maps to `./src/*`
- TypeScript strict mode partially disabled for flexibility
- Vite configured with HTTPS in production mode
- Server runs on `::` (all interfaces) port 8080