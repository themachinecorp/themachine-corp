import CardPageClient from './CardPageClient';

// page.tsx - Server component that exports generateStaticParams
// The actual data fetching happens client-side in CardPageClient

export function generateStaticParams() {
  return [];
}

export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Don't call getWatches here - CardPageClient fetches data client-side
  return <CardPageClient watchId={id} />;
}