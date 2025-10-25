import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import CallToAction from '@/components/landing/CallToAction';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata.home');
  
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function Home() {
  return (
    <div>
      <Hero />
      <Features />
      <CallToAction />
    </div>
  );
}
