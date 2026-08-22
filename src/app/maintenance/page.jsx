import Link from 'next/link';
import { redis } from '@/lib/redis';

export const metadata = {
  title: 'Under Maintenance',
  description: 'The platform is currently undergoing scheduled maintenance. We\'ll be back shortly.',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

async function getMaintenanceInfo() {
  try {
    const [siteName, tagline, supportEmail] = await Promise.all([
      redis.get('settings:site_name'),
      redis.get('settings:tagline'),
      redis.get('settings:support_email'),
    ]);
    return {
      siteName: siteName || 'Mindora',
      tagline: tagline || 'We\'re performing scheduled maintenance to improve your experience. We\'ll be back online shortly!',
      supportEmail: supportEmail || 'support@mindora.com',
    };
  } catch (error) {
    console.error('Failed to load maintenance settings from Redis:', error);
    return {
      siteName: 'Mindora',
      tagline: 'We\'re performing scheduled maintenance to improve your experience. We\'ll be back online shortly!',
      supportEmail: 'support@mindora.com',
    };
  }
}

export default async function MaintenancePage() {
  const { siteName, tagline, supportEmail } = await getMaintenanceInfo();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background grid decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(217 91% 60%) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(217 91% 60%) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* Animated gear icon */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-2xl shadow-amber-500/10">
              <svg
                className="w-12 h-12 text-amber-400 animate-spin"
                style={{ animationDuration: '8s' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" />
              </svg>
            </div>
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full border border-amber-500/20 animate-ping opacity-40" />
          </div>
        </div>

        {/* Wordmark */}
        <div className="mb-6">
          <span className="text-2xl font-black tracking-tight text-foreground">
            {siteName.toLowerCase() === 'mindora' ? (
              <>Mind<span className="text-primary">ora</span></>
            ) : siteName}
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-black text-foreground mb-4 leading-tight">
          Under Maintenance
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-lg leading-relaxed mb-10">
          {tagline}
        </p>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-full text-sm font-semibold mb-10">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Maintenance in progress
        </div>

        {/* Divider */}
        <div className="h-px bg-border mb-8" />

        {/* Support contact */}
        <p className="text-sm text-muted-foreground">
          Need urgent help?{' '}
          <a href={`mailto:${supportEmail}`} className="text-primary hover:underline font-medium">
            Contact support
          </a>
        </p>

        {/* Admin login link */}
        <div className="mt-8">
          <Link
            href="/auth/signin"
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline underline-offset-2"
          >
            Admin login
          </Link>
        </div>
      </div>
    </div>
  );
}
