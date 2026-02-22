"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Scissors, Play, Pause, Download, Loader2, CheckCircle2, RotateCcw, AlertTriangle, Clock, Volume2, VolumeX, Video, Music } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import AdSense from './AdSense';

interface MediaCropEditorProps {
    file: File;
    onReset: () => void;
}

export function MediaCropEditor({ file, onReset }: MediaCropEditorProps) {
    const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [processedUrl, setProcessedUrl] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const [duration, setDuration] = useState(0);
    const [range, setRange] = useState([0, 0]);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);

    // Manual input states
    const [startTimeInput, setStartTimeInput] = useState("00:00:00");
    const [endTimeInput, setEndTimeInput] = useState("00:00:00");

    const ffmpegRef = useRef<FFmpeg | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const isVideoFile = file.type.startsWith('video') || file.name.toLowerCase().endsWith('.mp4');
    const mediaRef = isVideoFile ? videoRef : audioRef;

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        return [
            hrs.toString().padStart(2, '0'),
            mins.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0')
        ].join(':');
    };

    const parseTimeToSeconds = (timeStr: string) => {
        const cleanTime = timeStr.split('.')[0];
        const parts = cleanTime.split(':').map(Number);

        let h = 0, m = 0, s = 0;
        if (parts.length === 3) { [h, m, s] = parts; }
        else if (parts.length === 2) { [m, s] = parts; }
        else if (parts.length === 1) { [s] = parts; }

        return (h * 3600) + (m * 60) + s;
    };

    // 1. Safe Blob URL Management
    useEffect(() => {
        const url = URL.createObjectURL(file);
        setFileUrl(url);
        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [file]);

    useEffect(() => {
        return () => {
            if (processedUrl) URL.revokeObjectURL(processedUrl);
        };
    }, [processedUrl]);

    // 2. FFmpeg Engine Load
    useEffect(() => {
        if (!ffmpegRef.current) loadFFmpeg();
    }, []);

    const loadFFmpeg = async () => {
        try {
            const ffmpegInstance = new FFmpeg();
            ffmpegRef.current = ffmpegInstance;
            ffmpegInstance.on('progress', ({ progress }) => setProgress(Math.round(progress * 100)));
            const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';
            await ffmpegInstance.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setFFmpeg(ffmpegInstance);
            setLoaded(true);
        } catch (err) {
            setError("Processing engine failed to start.");
        }
    };

    const handleMetadata = () => {
        const el = mediaRef.current;
        if (el && el.duration && el.duration !== Infinity) {
            setDuration(el.duration);
            setRange([0, el.duration]);
            setStartTimeInput(formatTime(0));
            setEndTimeInput(formatTime(el.duration));
        }
    };

    // Sync input fields when range changes (from slider)
    useEffect(() => {
        setStartTimeInput(formatTime(range[0]));
        setEndTimeInput(formatTime(range[1]));
    }, [range]);

    const handleManualTimeChange = (type: 'start' | 'end', value: string) => {
        if (type === 'start') setStartTimeInput(value);
        else setEndTimeInput(value);
    };

    const applyManualTime = (type: 'start' | 'end') => {
        const seconds = parseTimeToSeconds(type === 'start' ? startTimeInput : endTimeInput);
        if (isNaN(seconds)) return;

        const clampedSeconds = Math.max(0, Math.min(duration, seconds));
        if (type === 'start') {
            setRange([clampedSeconds, Math.max(clampedSeconds, range[1])]);
        } else {
            setRange([Math.min(clampedSeconds, range[0]), clampedSeconds]);
        }
    };

    const togglePlay = async () => {
        const el = mediaRef.current;
        if (!el) return;
        try {
            if (isPlaying) { el.pause(); setIsPlaying(false); }
            else { await el.play(); setIsPlaying(true); }
        } catch (err) { setIsPlaying(false); }
    };

    const cropMedia = async () => {
        if (!ffmpeg || !file || !fileUrl) return;
        setProcessing(true);
        try {
            const ext = isVideoFile ? '.mp4' : '.mp3';
            const inputName = `input${ext}`;
            const outputName = `output${ext}`;
            await ffmpeg.writeFile(inputName, await fetchFile(file));
            await ffmpeg.exec([
                '-ss', range[0].toFixed(3),
                '-i', inputName,
                '-t', (range[1] - range[0]).toFixed(3),
                '-c', 'copy', '-map', '0', outputName
            ]);
            const data = await ffmpeg.readFile(outputName);
            const resUrl = URL.createObjectURL(new Blob([data as any], { type: file.type || (isVideoFile ? 'video/mp4' : 'audio/mpeg') }));
            setProcessedUrl(resUrl);
        } catch (err) {
            alert('Crop failed.');
        } finally {
            setProcessing(false);
            setProgress(0);
        }
    };

    const [isMuted, setIsMuted] = useState(false);

    const toggleMute = () => {
        const el = mediaRef.current;
        if (!el) return;
        el.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleSeek = (value: number[]) => {
        const el = mediaRef.current;
        if (el) {
            el.currentTime = value[0];
            setCurrentTime(value[0]);
        }
    };

    return (
        <div className="w-full space-y-6 max-w-5xl mx-auto px-1 md:px-0">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-500 text-sm flex items-center gap-3 animate-in fade-in duration-300">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* File Info Header - Moved out of player */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 md:px-8 py-4 bg-primary/5 rounded-[2rem] border border-primary/10 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden">
                <div className="flex items-center gap-4 overflow-hidden flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-inner">
                        {isVideoFile ? <Video className="w-6 h-6 text-primary" /> : <Music className="w-6 h-6 text-primary" />}
                    </div>
                    <div className="flex flex-col overflow-hidden flex-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 leading-none mb-1.5">Now Editing</span>
                        <div className="marquee-container w-full">
                            <h2 className={cn(
                                "font-black text-base md:text-lg tracking-tight",
                                file.name.length > 30 && "animate-marquee"
                            )}>
                                {file.name}{file.name.length > 30 && ` \u00A0\u00A0\u00A0\u00A0 ${file.name}`}
                            </h2>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6 shrink-0 md:ml-4 border-t md:border-t-0 md:border-l border-primary/10 pt-3 md:pt-0 md:pl-6 ml-auto">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1.5">Total Length</span>
                        <span className="font-mono text-sm font-black text-primary">{formatTime(duration)}</span>
                    </div>
                </div>
            </div>

            <div className="glass rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl transition-all duration-300">
                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border/30">
                    {/* Main Editor Section */}
                    <div className="flex-1 p-5 md:p-8 lg:p-10 space-y-8">
                        {/* Custom Preview Player Area - Enlarged & Glow Effect */}
                        <div className="relative w-full aspect-[4/5] md:aspect-[21/9] bg-black/95 rounded-[2.5rem] overflow-hidden border border-border/20 shadow-inner flex items-center justify-center group/player">
                            {/* Ambient Glow Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />

                            {!fileUrl ? (
                                <div className="flex flex-col items-center gap-3 text-muted-foreground relative z-10 transition-opacity">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                    <span className="text-sm font-bold tracking-widest uppercase opacity-60">Initialising...</span>
                                </div>
                            ) : isVideoFile ? (
                                <video
                                    ref={videoRef}
                                    src={fileUrl}
                                    onLoadedMetadata={handleMetadata}
                                    onDurationChange={handleMetadata}
                                    onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                                    className="w-full h-full object-contain relative z-10"
                                    preload="auto"
                                    onClick={togglePlay}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center w-full px-8 relative z-10 transition-all duration-700">
                                    <motion.div
                                        animate={{
                                            scale: isPlaying ? [1, 1.05, 1] : 1,
                                            rotate: isPlaying ? [0, 3, -3, 0] : 0
                                        }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-accent/20 flex items-center justify-center relative shadow-[0_0_80px_rgba(var(--primary),0.3)] border-8 border-white/5"
                                    >
                                        <div className={cn("absolute inset-0 rounded-full bg-primary/10", isPlaying && "animate-ping scale-150 opacity-20")} />
                                        <div className={cn("absolute inset-4 rounded-full border-2 border-dashed border-primary/20", isPlaying && "animate-[spin_20s_linear_infinite]")} />
                                        <Scissors className="w-24 h-24 md:w-32 md:h-32 text-primary relative z-10 filter drop-shadow-[0_0_20px_rgba(var(--primary),0.5)]" />
                                    </motion.div>

                                    <audio
                                        ref={audioRef}
                                        src={fileUrl}
                                        onLoadedMetadata={handleMetadata}
                                        onDurationChange={handleMetadata}
                                        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                                        className="hidden"
                                        preload="auto"
                                    />
                                </div>
                            )}

                            {/* Overlay Controls - Improved Stability */}
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8 md:p-10 transition-all duration-300 z-20",
                                isPlaying ? "opacity-100" : "opacity-100"
                            )}>
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={togglePlay}
                                        className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/50 active:scale-95 transition-all hover:scale-105"
                                    >
                                        {isPlaying ? <Pause className="w-8 h-8 md:w-10 md:h-10 fill-current" /> : <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-1" />}
                                    </button>

                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-end px-1">
                                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{formatTime(currentTime)}</span>
                                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{formatTime(duration)}</span>
                                        </div>
                                        <Slider.Root
                                            className="relative flex items-center select-none touch-none w-full h-12 cursor-pointer group/seek"
                                            value={[currentTime]}
                                            max={duration || 100}
                                            step={0.01}
                                            onValueChange={handleSeek}
                                        >
                                            <Slider.Track className="bg-white/10 relative grow rounded-full h-3 overflow-hidden backdrop-blur-xl border border-white/10">
                                                <Slider.Range className="absolute bg-gradient-to-r from-primary to-accent rounded-full h-full" />
                                            </Slider.Track>
                                            <Slider.Thumb className="block w-8 h-8 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.4)] border-4 border-primary focus:outline-none transition-transform group-hover/seek:scale-110" />
                                        </Slider.Root>
                                    </div>

                                    <button
                                        onClick={toggleMute}
                                        className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all active:scale-90"
                                    >
                                        {isMuted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Crop Range Area - Enhanced for Touch */}
                        <div className="space-y-8 bg-secondary/5 p-6 rounded-[2rem] border border-border/30 shadow-inner">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <span className="text-[11px] font-bold text-primary/60 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        Crop Range Selection
                                    </span>
                                    <div className="text-3xl font-black tracking-tighter text-foreground">
                                        {formatTime(range[0])} - {formatTime(range[1])}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">Selected Area</div>
                                    <div className="text-lg font-mono font-bold text-primary">{formatTime(range[1] - range[0])}</div>
                                </div>
                            </div>

                            <div className="relative py-6 px-2">
                                <Slider.Root
                                    className="relative flex items-center select-none touch-none w-full h-12 cursor-pointer"
                                    value={range}
                                    max={duration || 100}
                                    step={0.001}
                                    onValueChange={setRange}
                                >
                                    <Slider.Track className="bg-secondary/40 relative grow rounded-full h-4 md:h-5 overflow-hidden shadow-inner">
                                        <Slider.Range className="absolute bg-primary rounded-full h-full shadow-[0_0_20px_rgba(var(--primary),0.6)]" />
                                    </Slider.Track>
                                    <Slider.Thumb
                                        className="block w-10 h-10 md:w-12 md:h-12 bg-white border-[6px] border-primary rounded-2xl focus:outline-none shadow-2xl cursor-grab active:cursor-grabbing hover:scale-110 transition-transform active:rotate-12"
                                        aria-label="Crop Start"
                                    />
                                    <Slider.Thumb
                                        className="block w-10 h-10 md:w-12 md:h-12 bg-white border-[6px] border-primary rounded-2xl focus:outline-none shadow-2xl cursor-grab active:cursor-grabbing hover:scale-110 transition-transform active:-rotate-12"
                                        aria-label="Crop End"
                                    />
                                </Slider.Root>

                                <div className="flex justify-between mt-6 px-1 opacity-40">
                                    {[...Array(9)].map((_, i) => (
                                        <div key={i} className={cn("bg-border rounded-full", i % 4 === 0 ? "h-4 w-1.5" : "h-2 w-1")} />
                                    ))}
                                </div>
                            </div>

                            {/* Manual Time Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={startTimeInput}
                                        onChange={(e) => handleManualTimeChange('start', e.target.value)}
                                        onBlur={() => applyManualTime('start')}
                                        onKeyDown={(e) => e.key === 'Enter' && applyManualTime('start')}
                                        className="w-full bg-background border-2 border-border/50 rounded-[1.25rem] px-6 py-4 font-mono text-xl font-black focus:outline-none focus:border-primary focus:ring-4 ring-primary/10 transition-all text-center"
                                    />
                                    <span className="absolute -top-3 left-6 bg-background px-2 text-[10px] font-black text-primary uppercase tracking-widest border border-border/50 rounded-full">Start Time</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={endTimeInput}
                                        onChange={(e) => handleManualTimeChange('end', e.target.value)}
                                        onBlur={() => applyManualTime('end')}
                                        onKeyDown={(e) => e.key === 'Enter' && applyManualTime('end')}
                                        className="w-full bg-background border-2 border-border/50 rounded-[1.25rem] px-6 py-4 font-mono text-xl font-black focus:outline-none focus:border-primary focus:ring-4 ring-primary/10 transition-all text-center"
                                    />
                                    <span className="absolute -top-3 left-6 bg-background px-2 text-[10px] font-black text-primary uppercase tracking-widest border border-border/50 rounded-full">End Time</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Actions Section */}
                    <div className="w-full lg:w-80 bg-secondary/10 p-6 md:p-8 lg:p-10 flex flex-col gap-6">
                        <div className="space-y-6 flex-1">
                            <div className="bg-background/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-border/50 shadow-2xl text-center space-y-8">
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">New Duration</h4>
                                    <div className="text-4xl font-black text-primary tracking-tighter truncate">
                                        {formatTime(range[1] - range[0])}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    {!processedUrl ? (
                                        <button
                                            onClick={cropMedia}
                                            disabled={processing || !loaded || !fileUrl}
                                            className={cn(
                                                "w-full h-24 rounded-[2rem] font-black text-2xl flex items-center justify-center transition-all shadow-[0_0_50px_rgba(var(--primary),0.2)] transform active:scale-95 group overflow-hidden relative",
                                                (processing || !loaded || !fileUrl)
                                                    ? "bg-muted text-muted-foreground"
                                                    : "bg-primary text-white hover:shadow-primary/40 hover:-translate-y-1"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 relative z-10 transition-transform group-hover:scale-105">
                                                {processing ? (
                                                    <>
                                                        <Loader2 className="w-8 h-8 animate-spin" />
                                                        <span className="text-sm font-bold tracking-widest uppercase">CREATING {progress}%</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Scissors className="w-8 h-8" />
                                                        <span className="tracking-tighter uppercase leading-none">CROP MEDIA</span>
                                                    </>
                                                )}
                                            </div>
                                            {!processing && (
                                                <>
                                                    <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/30 group-hover:h-full transition-all duration-700 opacity-20 pointer-events-none" />
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-center gap-3 text-white bg-green-500 py-4 rounded-2xl shadow-xl shadow-green-500/30 text-xs font-black uppercase tracking-widest animate-in zoom-in-95 duration-300">
                                                <CheckCircle2 className="w-5 h-5" />
                                                <span>FINISH!</span>
                                            </div>
                                            <button
                                                onClick={() => setProcessedUrl(null)}
                                                className="w-full py-4 bg-secondary border border-border/50 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-secondary/80"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                EDIT AGAIN
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onReset}
                            className="w-full py-5 rounded-[1.5rem] border-2 border-border/50 text-sm font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5 active:scale-95 transition-all"
                        >
                            Change File
                        </button>
                    </div>
                </div>
            </div>

            {/* Result Preview - Fully Custom Player Too */}
            <AnimatePresence>
                {processedUrl && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        className="pb-10 pt-4"
                    >
                        <div className="glass rounded-[3.5rem] overflow-hidden border-2 border-green-500/30 shadow-[0_30px_60px_rgba(34,197,94,0.25)] bg-green-500/5 p-8 md:p-12 space-y-10 relative">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500 text-white text-[10px] font-black tracking-[0.2em] uppercase">
                                        Success
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                                        Great Job! <br />
                                        <span className="text-green-500">Your file is ready.</span>
                                    </h3>
                                </div>
                                <a
                                    href={processedUrl}
                                    download={`cropped_${file.name}`}
                                    className="px-12 py-8 bg-green-500 text-white rounded-[2.5rem] font-black text-2xl flex items-center justify-center gap-4 hover:bg-green-600 transition-all shadow-[0_20px_40px_rgba(34,197,94,0.4)] hover:scale-105 active:scale-95 group"
                                >
                                    <Download className="w-8 h-8 group-hover:animate-bounce" />
                                    <span>GET FILE</span>
                                </a>
                            </div>

                            {/* Ad Placement 1: Between Download Button and Preview */}
                            <div className="relative z-10 py-2">
                                <AdSense adSlot="6655443322" adFormat="horizontal" />
                            </div>

                            <div className="bg-black/95 rounded-[3rem] border-4 border-white/5 p-4 shadow-3xl overflow-hidden group/result relative aspect-video flex items-center justify-center">
                                {isVideoFile ? (
                                    <video src={processedUrl} className="w-full h-full rounded-[2.5rem] object-contain" id="result-video" onClick={(e) => {
                                        const el = e.currentTarget;
                                        if (el.paused) el.play(); else el.pause();
                                    }} />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-10">
                                        <motion.div
                                            animate={{ scale: [1, 1.05, 1] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="w-32 h-32 rounded-full bg-green-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.3)]"
                                        >
                                            <Play className="w-12 h-12 text-green-500 fill-current ml-1" />
                                        </motion.div>
                                        <div className="text-green-500 font-mono text-2xl font-black tracking-widest uppercase">Preview Ready</div>
                                        <audio src={processedUrl} className="hidden" id="result-audio" />
                                    </div>
                                )}

                                {/* Result Custom Controls Overlay - Consistent with Editor */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8 opacity-0 group-hover/result:opacity-100 transition-all duration-300">
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => {
                                                const el = document.getElementById(isVideoFile ? 'result-video' : 'result-audio') as HTMLMediaElement;
                                                if (el.paused) el.play(); else el.pause();
                                            }}
                                            className="w-20 h-20 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-2xl shadow-green-500/50 active:scale-95 transition-all"
                                        >
                                            <Play className="w-10 h-10 fill-current ml-1" />
                                        </button>
                                        <div className="text-white">
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Cropped Result</div>
                                            <div className="text-xl font-black tracking-tighter">Tap to Preview</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Ad Placement 2: Bottom of Result */}
                            <div className="relative z-10 pt-2">
                                <AdSense adSlot="9988776655" adFormat="auto" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
