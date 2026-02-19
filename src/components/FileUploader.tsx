"use client";

import React, { useRef, useState } from 'react';
import { Upload, FileAudio, FileVideo, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    className?: string;
}

export function FileUploader({ onFileSelect, className }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            validateAndSelect(files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            validateAndSelect(files[0]);
        }
    };

    const validateAndSelect = (file: File) => {
        const type = file.type.toLowerCase();
        const name = file.name.toLowerCase();

        const isVideo = type.includes('mp4') || type.includes('video') || name.endsWith('.mp4');
        const isAudio = type.includes('mp3') || type.includes('mpeg') || type.includes('audio') || name.endsWith('.mp3');

        if (isVideo || isAudio) {
            onFileSelect(file);
        } else {
            alert("Please upload a valid MP3 or MP4 file.");
        }
    };

    return (
        <div
            className={cn(
                "relative group cursor-pointer",
                className
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleChange}
                accept=".mp3,.mp4,audio/*,video/*"
                className="hidden"
            />

            <div className={cn(
                "flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-all duration-300 glass hover:bg-white/5",
                isDragging ? "border-primary scale-[1.02] bg-white/5" : "border-border hover:border-primary/50"
            )}>
                <div className="w-20 h-20 mb-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-10 h-10 text-primary" />
                </div>

                <h3 className="text-xl font-semibold mb-2">Click or drag to upload</h3>
                <p className="text-muted-foreground text-center max-w-xs">
                    Support MP3 and MP4 files. Fast and easy cropping for your media content.
                </p>

                <div className="mt-8 flex gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                        <FileVideo className="w-3.5 h-3.5" /> MP4
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                        <FileAudio className="w-3.5 h-3.5" /> MP3
                    </div>
                </div>
            </div>

            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 rounded-2xl -z-10" />
        </div>
    );
}
