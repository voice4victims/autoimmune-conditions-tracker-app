# Project Structure

## Root Configuration
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration with path aliases
- `tailwind.config.ts` - Tailwind CSS configuration with custom theme
- `components.json` - shadcn/ui configuration
- `eslint.config.js` - ESLint rules

## Source Organization (`src/`)

### Core Application
- `main.tsx` - Application entry point with providers
- `App.tsx` - Main app component with routing setup
- `index.css` - Global styles and Tailwind imports

### Components (`src/components/`)
- **Main Components**: Feature-specific components (e.g., `SymptomTracker.tsx`, `TreatmentTracker.tsx`)
- **UI Components** (`ui/`): shadcn/ui components (buttons, cards, forms, etc.)
- **Analytics** (`analytics/`): Specialized analytics and chart components
- **Layout**: `AppLayout.tsx`, `PANDASApp.tsx` for main app structure

### State Management (`src/contexts/`)
- `AuthContext.tsx` - Authentication state
- `AppContext.tsx` - Global application state

### Utilities
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions and configurations
- `src/lib/validations/` - Zod schemas and validation logic
- `src/types/` - TypeScript type definitions

### Pages (`src/pages/`)
- Route-level components (Index, NotFound, PrivacyPolicy)

## Naming Conventions
- **Components**: PascalCase (e.g., `SymptomTracker.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useDeviceDetection.tsx`)
- **Utilities**: camelCase (e.g., `utils.ts`)
- **Types**: PascalCase interfaces/types in dedicated files

## Import Patterns
- Use `@/` alias for all internal imports
- Group imports: external libraries first, then internal modules
- Destructure imports from UI components: `import { Button } from '@/components/ui/button'`

## Component Structure
- Functional components with TypeScript interfaces for props
- Use React.FC type annotation
- Export default at bottom of file
- Group related functionality in feature-specific components