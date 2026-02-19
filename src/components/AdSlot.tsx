import React from 'react';
import { cn } from '@/lib/utils';

interface AdSlotProps {
    className?: string;
    label?: string;
}

export function AdSlot({ className, label = "Advertisement" }: AdSlotProps) {
    return (
        <div
            className={cn(
                "w-full bg-secondary/50 border border-border rounded-xl flex items-center justify-center p-4 min-h-[100px] text-muted-foreground text-sm relative overflow-hidden",
                className
            )}
        >
            <div className="absolute top-2 left-2 text-[10px] uppercase tracking-widest opacity-30">
                {label}
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded bg-muted animate-pulse" />
                <span>Ad Placement</span>
                {/* 
                  ACTUAL INTEGRATION: 
                  Replace this with your Google AdSense <ins> tag or other ad script.
                  Example: <ins className="adsbygoogle" ... />
                */}
            </div>
        </div>
    );
}
