import CardPageClient from './CardPageClient';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [];
}

export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CardPageClient watchId={id} />;
}