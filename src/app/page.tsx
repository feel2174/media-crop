"use client";

import React, { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { MediaCropEditor } from '@/components/MediaCropEditor';
import { AdSlot } from '@/components/AdSlot';
import { Scissors, Shield, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <main className="min-h-screen flex flex-col items-center">
      {/* Header/Navbar */}
      <header className="w-full h-20 border-b border-border/50 glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
              <Scissors className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">MediaCrop <span className="text-primary italic">Pro</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">How it works</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">FAQ</a>
            <div className="w-px h-4 bg-border" />
            <button className="px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-semibold">
              Get Started
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section & Top Ad */}
      <section className="w-full max-w-7xl px-6 pt-12 pb-8 flex flex-col items-center">
        <AdSlot className="mb-12 max-w-4xl mx-auto min-h-[90px]" label="Top Banner Ad" />

        <div className="text-center space-y-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 text-primary text-sm font-semibold mb-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Browser-based Media Editor</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight"
          >
            Crop MP3 & MP4 <br />
            <span className="gradient-text tracking-tighter">In Seconds.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Professional grade tool to cut your media files directly in your browser.
            No uploads, no servers, maximum privacy.
          </motion.p>
        </div>

        <div className="w-full max-w-4xl mx-auto min-h-[400px]">
          {!selectedFile ? (
            <div className="animate-in fade-in duration-500">
              <FileUploader onFileSelect={setSelectedFile} />
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              <MediaCropEditor
                file={selectedFile}
                onReset={() => setSelectedFile(null)}
              />
            </div>
          )}
        </div>
      </section>

      {/* Side Ads & Features */}
      <section className="w-full max-w-7xl px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Feature 1 */}
          <div className="space-y-4 text-center lg:text-left">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto lg:mx-0">
              <Shield className="text-primary w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Privacy First</h3>
            <p className="text-muted-foreground leading-relaxed">
              Your files NEVER leave your computer. All processing happens locally in your browser using WebAssembly technology.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="space-y-4 text-center lg:text-left">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto lg:mx-0">
              <Zap className="text-accent w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Lightning Fast</h3>
            <p className="text-muted-foreground leading-relaxed">
              No server wait times. Instant processing directly on your device, allowing you to crop and download in seconds.
            </p>
          </div>

          {/* Feature 3 (Ad Slot) */}
          <div className="flex flex-col gap-4">
            <AdSlot label="Sidebar Ad" className="h-full min-h-[200px]" />
          </div>
        </div>
      </section>

      {/* Bottom Ad */}
      <section className="w-full max-w-4xl px-6 pb-20">
        <AdSlot label="Footer Ad" />
      </section>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-border/50 glass">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            <span className="font-bold text-foreground">MediaCrop Pro</span>
            <span className="ml-2">© 2026. All rights reserved.</span>
          </div>

          <div className="flex gap-8">
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
