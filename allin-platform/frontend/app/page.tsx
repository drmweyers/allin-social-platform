export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AllIN Platform
          </h1>
          <p className="text-xl text-muted-foreground">
            AI-Powered Social Media Management Platform
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg space-y-2">
            <h3 className="text-lg font-semibold">🤖 AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Generate content, captions, and images with advanced AI
            </p>
          </div>
          
          <div className="p-6 border rounded-lg space-y-2">
            <h3 className="text-lg font-semibold">📅 Smart Scheduling</h3>
            <p className="text-sm text-muted-foreground">
              Queue-based scheduling with optimal timing predictions
            </p>
          </div>
          
          <div className="p-6 border rounded-lg space-y-2">
            <h3 className="text-lg font-semibold">📊 Unified Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Track performance across all platforms in one dashboard
            </p>
          </div>
        </div>
        
        <div className="flex justify-center space-x-4 mt-12">
          <a
            href="/auth/register"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Get Started
          </a>
          <a
            href="/auth/login"
            className="px-8 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    </main>
  );
}