# Story 003: Next.js Application Setup
**Sprint**: 0 - Infrastructure Setup
**Points**: 8
**Priority**: CRITICAL
**Type**: Frontend Setup

## Story Description
As a developer, I need to set up the Next.js 14 application with TypeScript, Tailwind CSS, and all required UI libraries (Radix UI, shadcn/ui components) so that we have a fully configured frontend development environment ready for feature development.

## Acceptance Criteria
- [ ] Next.js 14 application created with App Router
- [ ] TypeScript configured with strict mode
- [ ] Tailwind CSS configured with custom theme
- [ ] Radix UI components installed and configured
- [ ] shadcn/ui setup with component library
- [ ] State management (Jotai, Recoil) configured
- [ ] Axios configured for API calls
- [ ] Chart libraries integrated
- [ ] Framer Motion ready for animations
- [ ] Basic layout and routing structure created
- [ ] Environment variables configured

## Technical Details

### Step 1: Create Next.js Application
```bash
# From project root
npx create-next-app@14.2.18 frontend --typescript --tailwind --app --src-dir --import-alias "@/*"

# Navigate to frontend
cd frontend
```

### Step 2: Install All Required Dependencies
```bash
# Core UI Libraries
npm install @radix-ui/react-dialog@latest \
  @radix-ui/react-dropdown-menu@latest \
  @radix-ui/react-select@latest \
  @radix-ui/react-toast@latest \
  @radix-ui/react-tabs@latest \
  @radix-ui/react-checkbox@latest \
  @radix-ui/react-switch@latest \
  @radix-ui/react-avatar@latest \
  @radix-ui/react-popover@latest \
  @radix-ui/react-tooltip@latest

# Icons
npm install lucide-react@latest @heroicons/react@latest

# State Management
npm install jotai@2.10.3 recoil@0.7.7

# Forms and Validation
npm install react-hook-form@7.53.2 zod@3.23.8 @hookform/resolvers@latest

# Data Fetching
npm install axios@1.7.7 swr@latest

# Charts and Visualization
npm install chart.js@4.5.0 react-chartjs-2@5.3.0 recharts@2.13.3

# Animations
npm install framer-motion@11.11.17

# Drag and Drop
npm install @dnd-kit/core@6.1.0 @dnd-kit/sortable@8.0.0

# Utilities
npm install date-fns@3.6.0 clsx@2.1.1 class-variance-authority@0.7.1

# Tailwind Plugins
npm install @tailwindcss/forms@latest @tailwindcss/typography@latest tailwindcss-animate@latest

# Development Dependencies
npm install -D @types/node@latest
```

### Step 3: Configure TypeScript

#### File: `/frontend/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/types/*": ["./src/types/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 4: Configure Tailwind CSS

#### File: `/frontend/tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
}

export default config
```

### Step 5: Update Global Styles

#### File: `/frontend/src/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

### Step 6: Create Utility Functions

#### File: `/frontend/src/lib/utils.ts`
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, format: string = "PPP"): string {
  // Implement with date-fns
  return new Date(date).toLocaleDateString()
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
```

### Step 7: Set Up API Client

#### File: `/frontend/src/lib/api/client.ts`
```typescript
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

class ApiClient {
  private client: AxiosInstance
  private refreshPromise: Promise<string> | null = null

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken()
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error: AxiosError) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            if (!this.refreshPromise) {
              this.refreshPromise = this.refreshAccessToken()
            }

            const newToken = await this.refreshPromise
            this.refreshPromise = null

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
            }

            return this.client(originalRequest)
          } catch (refreshError) {
            this.logout()
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token')
    }
    return null
  }

  private setAccessToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token)
    }
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token')

    const response = await this.client.post('/auth/refresh', {
      refreshToken,
    })

    const { accessToken } = response.data
    this.setAccessToken(accessToken)

    return accessToken
  }

  private logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
  }

  // Public methods
  get = this.client.get
  post = this.client.post
  put = this.client.put
  patch = this.client.patch
  delete = this.client.delete
}

export const apiClient = new ApiClient()
```

### Step 8: Set Up State Management

#### File: `/frontend/src/stores/authStore.ts`
```typescript
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'MANAGER' | 'PUBLISHER' | 'CONTRIBUTOR' | 'VIEWER'
  organizationId: string
}

export interface Organization {
  id: string
  name: string
  plan: 'STARTER' | 'PROFESSIONAL' | 'TEAM' | 'ENTERPRISE'
}

export const userAtom = atomWithStorage<User | null>('user', null)
export const organizationAtom = atomWithStorage<Organization | null>('organization', null)
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null)
export const isLoadingAtom = atom(false)
```

### Step 9: Create Base UI Components

#### File: `/frontend/src/components/ui/button.tsx`
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### Step 10: Create App Layout

#### File: `/frontend/src/app/layout.tsx`
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AllIN - AI-Powered Social Media Management',
  description: 'Manage all your social media accounts in one place with AI-powered content creation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

#### File: `/frontend/src/app/providers.tsx`
```typescript
'use client'

import { Provider as JotaiProvider } from 'jotai'
import { RecoilRoot } from 'recoil'
import { Toaster } from '@/components/ui/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <RecoilRoot>
        {children}
        <Toaster />
      </RecoilRoot>
    </JotaiProvider>
  )
}
```

### Step 11: Create Environment Variables

#### File: `/frontend/.env.local`
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5001

# Public App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AllIN
NEXT_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_AI_FEATURES=true

# Third-party Services (Public Keys Only!)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
NEXT_PUBLIC_SENTRY_DSN=
```

### Step 12: Create Initial Pages

#### File: `/frontend/src/app/page.tsx`
```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-4xl text-center">
        <h1 className="mb-4 text-5xl font-bold">
          Welcome to AllIN
        </h1>
        <p className="mb-8 text-xl text-muted-foreground">
          AI-Powered Social Media Management Platform
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/login">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/about">Learn More</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

## Implementation Notes

1. **App Router**: Using Next.js 14 App Router for better performance
2. **TypeScript**: Strict mode enabled for type safety
3. **Styling**: Tailwind CSS with custom design tokens
4. **Components**: Radix UI primitives with shadcn/ui patterns
5. **State**: Jotai for global state, Recoil for complex patterns
6. **API**: Axios with interceptors for auth refresh

## Testing Instructions

1. **Start Development Server**:
```bash
cd frontend
npm run dev
```

2. **Verify Application**:
- Open http://localhost:3000
- Should see welcome page
- Check console for no errors

3. **Test Build**:
```bash
npm run build
```

## Troubleshooting

1. **Module Resolution**: Check tsconfig paths if imports fail
2. **Styling Issues**: Ensure Tailwind config is correct
3. **Type Errors**: Run `npm run type-check` to identify issues

## Dependencies
All dependencies listed in Step 2

## Blocking Issues
None

## Next Steps
After completing this story, proceed to:
- STORY-004: Express backend setup
- STORY-005: Prisma schema setup
- Component library setup

## Time Estimate
- Next.js setup: 30 minutes
- Dependencies: 45 minutes
- Configuration: 60 minutes
- Components: 45 minutes
- Total: 3 hours

## Notes for Dev Agent
- Ensure all paths use forward slashes
- Test each major dependency installation
- Verify TypeScript strict mode works
- Check that all UI components render correctly