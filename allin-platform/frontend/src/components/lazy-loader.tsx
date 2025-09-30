import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Loading component
export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Lazy load dashboard pages
export const LazyAnalyticsOverview = lazy(() => import('@/app/dashboard/analytics/overview/page'));
export const LazyAnalyticsCompetitors = lazy(() => import('@/app/dashboard/analytics/competitors/page'));
export const LazyAnalyticsReports = lazy(() => import('@/app/dashboard/analytics/reports/page'));
export const LazyAIDashboard = lazy(() => import('@/app/dashboard/ai/page'));
export const LazyCalendar = lazy(() => import('@/app/dashboard/calendar/page'));
export const LazyCreatePost = lazy(() => import('@/app/dashboard/create/page'));

// Wrapper component for lazy loaded pages
export const LazyPage = ({ Component }: { Component: React.ComponentType<any> }) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);