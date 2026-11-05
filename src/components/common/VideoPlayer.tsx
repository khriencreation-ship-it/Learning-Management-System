"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
    src: string;
    poster?: string;
    onTimeUpdate?: (e: any) => void;
    onLoadedMetadata?: (e: any) => void;
    onSeeked?: (e: any) => void;
    onEnded?: () => void;
    className?: string;
}

/**
 * Normalizes a video URL or iframe snippet and determines how to play it:
 * - 'embed': Bunny.net Stream Direct Play / Embed URL (iframe.mediadelivery.net or video.bunnycdn.com/play|embed)
 * - 'hls': HLS playlist (.m3u8)
 * - 'direct': Direct video file (.mp4, .webm, .mov, etc.)
 */
function parseVideoSource(rawSrc: string): { mode: 'embed' | 'hls' | 'direct'; url: string } {
    if (!rawSrc) return { mode: 'direct', url: '' };

    let cleanSrc = rawSrc.trim();

    // 1. If user pasted a full <iframe ... src="..."> snippet, extract the src URL
    if (cleanSrc.includes('<iframe')) {
        const match = cleanSrc.match(/src=["']([^"']+)["']/i);
        if (match?.[1]) {
            cleanSrc = match[1].trim();
        }
    }

    // 2. Check for Bunny Stream Direct Play or Embed URLs:
    //    e.g. https://player.mediadelivery.net/play/{libraryId}/{videoId}
    //    e.g. https://player.mediadelivery.net/embed/{libraryId}/{videoId}
    //    e.g. https://iframe.mediadelivery.net/play/{libraryId}/{videoId}
    //    e.g. https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
    //    e.g. https://video.bunnycdn.com/play/{libraryId}/{videoId}
    //    e.g. https://video.bunnycdn.com/embed/{libraryId}/{videoId}
    const bunnyEmbedMatch = cleanSrc.match(
        /(?:(?:[a-z0-9-]+\.)?mediadelivery\.net|video\.bunnycdn\.com)\/(?:play|embed)\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9-]+)/i
    );
    if (bunnyEmbedMatch) {
        const [, libraryId, videoId] = bunnyEmbedMatch;
        // Preserve any existing query params or add sensible defaults
        const urlObj = new URL(`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`);
        try {
            const originalUrl = new URL(cleanSrc.startsWith('http') ? cleanSrc : `https://${cleanSrc}`);
            originalUrl.searchParams.forEach((val, key) => urlObj.searchParams.set(key, val));
        } catch {
            // ignore URL parse error
        }
        if (!urlObj.searchParams.has('autoplay')) urlObj.searchParams.set('autoplay', 'false');
        if (!urlObj.searchParams.has('preload')) urlObj.searchParams.set('preload', 'true');
        if (!urlObj.searchParams.has('responsive')) urlObj.searchParams.set('responsive', 'true');
        return { mode: 'embed', url: urlObj.toString() };
    }

    // Ensure protocol
    if (cleanSrc.startsWith('//')) {
        cleanSrc = `https:${cleanSrc}`;
    } else if (!cleanSrc.startsWith('http://') && !cleanSrc.startsWith('https://') && !cleanSrc.startsWith('/') && !cleanSrc.startsWith('blob:')) {
        cleanSrc = `https://${cleanSrc}`;
    }

    // 3. Check if it is actually an HLS playlist (.m3u8)
    //    Note: Direct .mp4 files hosted on b-cdn.net or bunnycdn.com must NOT use Hls.js
    const isM3u8 = /\.m3u8(\?.*)?$/i.test(cleanSrc) || cleanSrc.toLowerCase().includes('.m3u8');
    if (isM3u8) {
        return { mode: 'hls', url: cleanSrc };
    }

    // 4. Direct video file (.mp4, .webm, etc.)
    return { mode: 'direct', url: cleanSrc };
}

export default function VideoPlayer({
    src,
    poster,
    onTimeUpdate,
    onLoadedMetadata,
    onSeeked,
    onEnded,
    className = ""
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const parsed = parseVideoSource(src);
    const [mode, setMode] = useState<'embed' | 'hls' | 'direct'>(parsed.mode);

    useEffect(() => {
        const currentParsed = parseVideoSource(src);
        setMode(currentParsed.mode);

        if (currentParsed.mode === 'embed') {
            // Listen for Player.js / Bunny Stream postMessage events if available
            const handleMessage = (event: MessageEvent) => {
                if (!event.origin.includes('mediadelivery.net') && !event.origin.includes('bunnycdn.com')) {
                    return;
                }
                try {
                    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                    if (!data) return;

                    if (data.event === 'ready' && onLoadedMetadata) {
                        onLoadedMetadata({
                            target: {
                                currentTime: 0,
                                duration: data.value?.duration || 0,
                                ended: false
                            }
                        });
                    } else if (data.event === 'timeupdate' && onTimeUpdate) {
                        const currentTime = data.value?.seconds ?? data.value?.currentTime ?? 0;
                        const duration = data.value?.duration ?? 0;
                        onTimeUpdate({
                            target: {
                                currentTime,
                                duration,
                                ended: duration > 0 && currentTime >= duration
                            }
                        });
                    } else if (data.event === 'ended' && onEnded) {
                        onEnded();
                    }
                } catch {
                    // Ignore non-JSON messages
                }
            };

            window.addEventListener('message', handleMessage);
            return () => window.removeEventListener('message', handleMessage);
        }

        const video = videoRef.current;
        if (!video || !currentParsed.url) return;

        let hls: Hls | null = null;

        if (currentParsed.mode === 'hls') {
            if (Hls.isSupported()) {
                hls = new Hls({
                    capLevelToPlayerSize: true,
                    autoStartLoad: true,
                });
                hls.loadSource(currentParsed.url);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (onLoadedMetadata) {
                        onLoadedMetadata({ target: video });
                    }
                });

                hls.on(Hls.Events.ERROR, (_event, data) => {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls?.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls?.recoverMediaError();
                                break;
                            default:
                                // Fallback to direct video playback if manifest parsing failed (e.g. URL is actually MP4)
                                hls?.destroy();
                                hls = null;
                                setMode('direct');
                                video.src = currentParsed.url;
                                break;
                        }
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari / iOS)
                video.src = currentParsed.url;
            }
        } else {
            // Direct MP4 / WebM playback
            if (video.src !== currentParsed.url) {
                video.src = currentParsed.url;
            }
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [src]);

    if (parsed.mode === 'embed') {
        return (
            <div className={`relative group bg-black rounded-xl overflow-hidden shadow-2xl ${className}`}>
                <iframe
                    ref={iframeRef}
                    src={parsed.url}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                />
            </div>
        );
    }

    return (
        <div className={`relative group bg-black rounded-xl overflow-hidden shadow-2xl ${className}`}>
            <video
                ref={videoRef}
                poster={poster}
                controls
                controlsList="nodownload"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                playsInline
                className="w-full h-full object-contain"
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onSeeked={onSeeked}
                onEnded={onEnded}
            />
            
            {/* Premium Overlay Hint */}
            <div className="absolute top-4 right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${mode === 'hls' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        {mode === 'hls' ? 'Adaptive HD' : 'Direct Play'}
                    </span>
                </div>
            </div>
        </div>
    );
}
