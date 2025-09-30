# BMAD AllIN Platform - Troubleshooting Guide

## Common Issues and Solutions

### 1. Missing `use-toast` Hook Error

**Error Message:**
```
Module not found: Can't resolve '@/hooks/use-toast'
```

**Root Cause:**
The `use-toast` hook is missing from the frontend hooks directory. This is required by the team collaboration dashboard and other components.

**Solution:**
Create the file at `allin-platform/frontend/src/hooks/use-toast.ts`:

```typescript
import * as React from 'react';

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type Action =
  | { type: 'ADD_TOAST'; toast: ToasterToast }
  | { type: 'UPDATE_TOAST'; toast: Partial<ToasterToast> }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case 'DISMISS_TOAST': {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, 'id'>;

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}

function genId() {
  return Math.random().toString(36).substring(2, 9);
}

export { useToast, toast };
```

**Prevention:**
- Always ensure the hooks directory exists at `frontend/src/hooks/`
- Check that the TypeScript path alias `@/` maps to `./src/*` in `tsconfig.json`

---

### 2. TypeScript Compilation Errors

**Common Issues:**
- Express Request type extension errors
- Missing imports
- Type mismatches

**Solutions:**
1. Ensure proper type declarations in `backend/src/types/express.d.ts`
2. Run `npm run typecheck` to identify issues
3. Temporarily disable problematic routes if needed

---

### 3. Development Server Issues

**Multiple Backend Servers Running:**
If you see multiple backend development servers running in background:

```bash
# List all running Node processes
tasklist | findstr node

# Kill specific process
taskkill /PID <process_id> /F

# Or kill all Node processes (careful!)
taskkill /F /IM node.exe
```

---

### 4. Frontend Path Resolution

**Issue:** Module not found errors for `@/` imports

**Solution:** Ensure `tsconfig.json` has proper path mappings:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@utils/*": ["./src/utils/*"],
      "@lib/*": ["./src/lib/*"]
    },
    "baseUrl": "."
  }
}
```

---

### 5. Analytics API Errors

**Error:** "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

**Cause:** Backend API routes returning HTML error pages instead of JSON

**Solution:**
1. Check backend is running on port 5000
2. Verify API routes are properly configured
3. Ensure CORS is configured correctly
4. Check that API proxy routes in Next.js are pointing to correct backend URL

---

## Quick Start Commands

### Starting Development Environment

```bash
# 1. Start Docker (if using Docker)
docker-compose --profile dev up -d

# 2. Start Backend
cd allin-platform/backend
npm run dev

# 3. Start Frontend (new terminal)
cd allin-platform/frontend
npm run dev
```

### Verify Services

- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:5000
- **Database**: PostgreSQL on localhost:5432
- **Redis**: localhost:6380

### Common Fixes

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset database
npx prisma migrate reset
npx prisma migrate dev
```

---

## Project Structure Requirements

```
allin-platform/
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js app directory
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks (MUST include use-toast.ts)
│   │   └── lib/          # Utility functions
│   └── tsconfig.json     # TypeScript config with path aliases
├── backend/
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── types/        # TypeScript declarations
│   └── tsconfig.json
└── docker-compose.yml
```

---

## Session Recovery

If returning to the project after a break:

1. Check Docker is running
2. Start backend server
3. Start frontend server
4. Check for any new migrations: `npx prisma migrate dev`
5. Verify all services are accessible

---

## Contact & Support

For issues not covered here:
- Check `planning.md` for architecture details
- Review `tasks.md` for known issues
- Consult `project_roadmap.md` for feature status

Last Updated: January 2025 - Session 9