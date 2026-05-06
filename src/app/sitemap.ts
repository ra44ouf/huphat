import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://huphat.vercel.app';

  // Static routes
  const routes = [
    '',
    '/videos',
    '/books',
    '/login',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  try {
    const supabase = await createClient();
    
    // Fetch all doubts for sitemap
    const { data: doubts } = await supabase
      .from('doubts')
      .select('slug, updated_at');

    const doubtRoutes = (doubts || []).map((doubt) => ({
      url: `${baseUrl}/doubts/${doubt.slug}`,
      lastModified: new Date(doubt.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...routes, ...doubtRoutes];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return routes;
  }
}
