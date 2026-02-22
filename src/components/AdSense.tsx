'use client';

import { useEffect, useRef } from 'react';

interface AdSenseProps {
    adSlot: string;
    adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
    style?: React.CSSProperties;
    className?: string;
    responsive?: 'true' | 'false';
}

export default function AdSense({
    adSlot,
    adFormat = 'auto',
    style = {},
    className = '',
    responsive = 'true'
}: AdSenseProps) {
    const initialized = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && !initialized.current) {
            try {
                ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
                initialized.current = true;
            } catch (error) {
                console.error('AdSense error:', error);
            }
        }
    }, [adSlot]); // Re-run if slot changes, though usually it doesn't

    return (
        <div
            className={`ad-container w-full overflow-hidden flex flex-col items-center justify-center my-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] min-h-[100px] transition-all duration-500 ${className}`}
            style={style}
        >
            <div className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-white/10 mb-2 text-center pointer-events-none">
                Advertisement
            </div>
            <ins
                className="adsbygoogle"
                style={{ display: 'block', width: '100%', minHeight: '90px' }}
                data-ad-client="ca-pub-9196149361612087"
                data-ad-slot={adSlot}
                data-ad-format={adFormat}
                data-full-width-responsive={responsive}
            />
        </div>
    );
}
