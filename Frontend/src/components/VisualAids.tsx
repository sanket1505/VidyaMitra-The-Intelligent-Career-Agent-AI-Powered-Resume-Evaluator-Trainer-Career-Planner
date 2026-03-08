import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Image as ImageIcon, ExternalLink } from 'lucide-react';

type Visual = {
  id: string | number;
  src?: string;
  image?: string;
  url?: string;
  alt?: string;
  photographer?: string;
};

const FALLBACK_VISUALS: Visual[] = [
  {
    id: 'fallback-1',
    src: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Programming setup',
    photographer: 'Pexels',
    url: 'https://www.pexels.com/',
  },
  {
    id: 'fallback-2',
    src: 'https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Analytics dashboard',
    photographer: 'Pexels',
    url: 'https://www.pexels.com/',
  },
  {
    id: 'fallback-3',
    src: 'https://images.pexels.com/photos/270404/pexels-photo-270404.jpeg?auto=compress&cs=tinysrgb&w=800',
    alt: 'Code on screen',
    photographer: 'Pexels',
    url: 'https://www.pexels.com/',
  },
];

export default function VisualAids({ topic }: { topic: string }) {
  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVisuals = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/media/visuals?topic=${encodeURIComponent(topic)}`);
        const apiVisuals = Array.isArray(res.data?.visuals) ? res.data.visuals : [];
        setVisuals(apiVisuals.length > 0 ? apiVisuals : FALLBACK_VISUALS);
      } catch (err) {
        console.error('Failed to load Pexels visuals', err);
        setVisuals(FALLBACK_VISUALS);
      } finally {
        setLoading(false);
      }
    };

    if (topic) {
      void loadVisuals();
    } else {
      setVisuals(FALLBACK_VISUALS);
      setLoading(false);
    }
  }, [topic]);

  if (loading) return <div className="surface-card h-48 animate-pulse" />;

  return (
    <section className="surface-card p-5 sm:p-6">
      <h3 className="mb-5 flex items-center gap-2 text-xl font-bold">
        <ImageIcon className="h-5 w-5 text-sky-300" />
        Visual Learning Resources
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visuals.map((img) => {
          const imageSrc = img.src || img.image || img.url;
          return (
            <div key={String(img.id)} className="surface-card-soft group relative overflow-hidden">
              <img
                src={imageSrc}
                alt={img.alt || 'Learning resource'}
                className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_VISUALS[0].src as string;
                }}
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-950/85 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-xs text-slate-200">Photo by {img.photographer || 'Pexels'}</p>
                <a href={img.url || 'https://www.pexels.com/'} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs font-bold text-sky-300">
                  View source <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {visuals.length === 0 && <p className="mt-3 text-sm text-slate-400">No visuals available for this topic yet.</p>}
    </section>
  );
}

