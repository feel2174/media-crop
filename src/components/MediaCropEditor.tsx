"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Scissors, Play, Pause, Download, Loader2, CheckCircle2, RotateCcw, AlertTriangle, Clock } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

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
    const [startTimeInput, setStartTimeInput] = useState("00:00:00.00");
    const [endTimeInput, setEndTimeInput] = useState("00:00:00.00");

    const ffmpegRef = useRef<FFmpeg | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const isVideoFile = file.type.startsWith('video') || file.name.toLowerCase().endsWith('.mp4');
    const mediaRef = isVideoFile ? videoRef : audioRef;

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);

        return [
            hrs.toString().padStart(2, '0'),
            mins.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0')
        ].join(':') + `.${ms.toString().padStart(2, '0')}`;
    };

    const parseTimeToSeconds = (timeStr: string) => {
        const [time, ms] = timeStr.split('.');
        const [h, m, s] = time.split(':').map(Number);
        return (h * 3600) + (m * 60) + s + (Number(ms || 0) / 100);
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

    return (
        <div className="w-full space-y-8 max-w-4xl mx-auto">
            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-500 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{error}</div>}

            <div className="glass rounded-3xl overflow-hidden border border-border/50 shadow-2xl">
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                        {/* Preview Area */}
                        <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-border/30 flex items-center justify-center">
                            {!fileUrl ? (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground"><Loader2 className="w-8 h-8 animate-spin" /><span className="text-xs">Initialising...</span></div>
                            ) : isVideoFile ? (
                                <video ref={videoRef} src={fileUrl} onLoadedMetadata={handleMetadata} onDurationChange={handleMetadata} onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)} className="w-full h-full object-contain" preload="auto" />
                            ) : (
                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"><Scissors className="w-12 h-12 text-primary" /></div>
                                    <audio ref={audioRef} src={fileUrl} onLoadedMetadata={handleMetadata} onDurationChange={handleMetadata} onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)} className="w-full max-w-xs" controls preload="auto" />
                                    <span className="text-sm font-medium opacity-60 px-4 text-center">{file.name}</span>
                                </div>
                            )}
                            {!isPlaying && fileUrl && (
                                <button onClick={togglePlay} className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-glow hover:scale-110 transition-transform z-10"><Play className="w-8 h-8 fill-current ml-1" /></button>
                            )}
                        </div>

                        {/* Slider & Timing Area */}
                        <div className="space-y-6 p-2">
                            <div className="flex justify-between items-end mb-2">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3 h-3" /> Current Seek</span>
                                    <div className="text-2xl font-mono font-bold text-primary">{formatTime(currentTime)}</div>
                                </div>
                                <div className="text-xs font-mono text-muted-foreground">Total: {formatTime(duration)}</div>
                            </div>

                            <Slider.Root className="relative flex items-center select-none touch-none w-full h-5" value={range} max={duration || 100} step={0.001} onValueChange={setRange}>
                                <Slider.Track className="bg-muted relative grow rounded-full h-2">
                                    <Slider.Range className="absolute bg-primary rounded-full h-full" />
                                </Slider.Track>
                                <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-primary rounded-full focus:outline-none shadow-lg cursor-pointer hover:scale-125 transition-transform" />
                                <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-primary rounded-full focus:outline-none shadow-lg cursor-pointer hover:scale-125 transition-transform" />
                            </Slider.Root>

                            {/* Manual Time Inputs */}
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-primary uppercase tracking-widest pl-1">Start Point</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={startTimeInput}
                                            onChange={(e) => handleManualTimeChange('start', e.target.value)}
                                            onBlur={() => applyManualTime('start')}
                                            onKeyDown={(e) => e.key === 'Enter' && applyManualTime('start')}
                                            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-primary uppercase tracking-widest pl-1">End Point</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={endTimeInput}
                                            onChange={(e) => handleManualTimeChange('end', e.target.value)}
                                            onBlur={() => applyManualTime('end')}
                                            onKeyDown={(e) => e.key === 'Enter' && applyManualTime('end')}
                                            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[9px] text-muted-foreground text-center opacity-50 uppercase tracking-tighter">Enter to Apply Time Changes</p>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-full md:w-64 flex flex-col gap-4">
                        <div className="bg-secondary/30 rounded-2xl p-6 border border-border/40 space-y-6">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold opacity-80">Final Duration</h4>
                                <p className="text-lg font-mono font-bold text-primary">{formatTime(range[1] - range[0])}</p>
                            </div>
                            {!processedUrl ? (
                                <button onClick={cropMedia} disabled={processing || !loaded || !fileUrl} className={cn("w-full py-4 rounded-xl font-bold flex flex-col items-center justify-center transition-all shadow-glow", (processing || !loaded || !fileUrl) ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-white hover:bg-primary/90")}>
                                    {processing ? <><Loader2 className="w-5 h-5 animate-spin mb-1" /><span className="text-xs">Processing {progress}%</span></> : !loaded ? <><Loader2 className="w-5 h-5 animate-spin mb-1" /><span className="text-[10px]">Loading...</span></> : <><Scissors className="w-5 h-5 mb-1" /><span>Crop Media</span></>}
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-green-500 bg-green-500/10 p-2 rounded-xl border border-green-500/10 text-[10px] font-bold uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /><span>Ready</span></div>
                                    <button onClick={() => setProcessedUrl(null)} className="w-full py-3 border border-border bg-secondary/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"><RotateCcw className="w-3 h-3" />Reset</button>
                                </div>
                            )}
                        </div>
                        <button onClick={onReset} className="w-full py-3 rounded-xl border border-border/50 hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-widest">Change File</button>
                    </div>
                </div>
            </div>

            {/* Result Preview */}
            {processedUrl && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="glass rounded-3xl overflow-hidden border border-green-500/30 shadow-2xl bg-green-500/5 p-6 md:p-8 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-xl font-bold flex items-center gap-2"><CheckCircle2 className="text-green-500 w-6 h-6" />Your Media is Ready!</h3>
                            <a href={processedUrl} download={`cropped_${file.name}`} className="px-8 py-4 bg-green-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-[0.98]"><Download className="w-5 h-5" />Download Now</a>
                        </div>
                        <div className="bg-black/40 rounded-2xl border border-white/5 p-4 md:p-6">
                            {isVideoFile ? <video src={processedUrl} controls className="w-full rounded-xl aspect-video bg-black shadow-2xl mx-auto max-h-[500px]" /> : <div className="py-8 flex flex-col items-center gap-4"><Play className="w-10 h-10 text-green-500 fill-current" /><audio src={processedUrl} controls className="w-full max-w-2xl" /></div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
