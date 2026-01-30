'use client';

import { Section } from "@/types/cms";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, ShoppingBag, Zap, ChevronLeft, ChevronRight } from "lucide-react";

// --- Reusable Carousel Component ---
const UniversalCarousel = ({
    images,
    autoPlayInterval = 6000,
    className = "",
    imageClassName = "",
    overlayOpacity = 1
}: {
    images: string[],
    autoPlayInterval?: number,
    className?: string,
    imageClassName?: string,
    overlayOpacity?: number
}) => {
    const [index, setIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (images.length <= 1 || isHovered) return;
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, autoPlayInterval);
        return () => clearInterval(interval);
    }, [images, autoPlayInterval, isHovered]);

    const nextSlide = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        setIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        setIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (!images || images.length === 0) return null;

    return (
        <div
            className={`relative group overflow-hidden ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: overlayOpacity }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 z-0"
                >
                    <motion.img
                        src={images[index]}
                        alt=""
                        initial={{ scale: 1.15 }}
                        animate={{ scale: 1.0 }}
                        transition={{ duration: 8, ease: "linear" }}
                        className={`w-full h-full object-cover ${imageClassName}`}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Manual Controls */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-4 text-white/20 hover:text-[#d8aa5b] transition-all bg-black/10 hover:bg-black/40 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 border border-white/5 shadow-2xl"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-4 text-white/20 hover:text-[#d8aa5b] transition-all bg-black/10 hover:bg-black/40 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 border border-white/5 shadow-2xl"
                    >
                        <ChevronRight size={20} />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIndex(i); }}
                                className={`h-1 transition-all duration-700 rounded-full ${i === index ? 'w-10 bg-[#d8aa5b] shadow-[0_0_15px_rgba(216,170,91,0.5)]' : 'w-2 bg-white/10 hover:bg-white/30'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { AnimatePresence } from "framer-motion";

// --- Section Components ---

const HeroSection = ({ content }: { content: any }) => {
    const images = content.backgroundImages || (content.backgroundImage ? [content.backgroundImage] : []);

    return (
        <section className="h-screen w-full flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#050505_0%,_#000_100%)] opacity-80 z-0"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505] z-10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[radial-gradient(circle,_rgba(216,170,91,0.15)_0%,_transparent_70%)] blur-[100px] z-0 animate-pulse duration-[8000ms]"></div>

            <UniversalCarousel
                images={images}
                className="absolute inset-0 z-[-1]"
                overlayOpacity={0.5}
            />

            <div className="relative z-20 text-center flex flex-col items-center max-w-4xl px-4 mx-auto">
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-display text-5xl md:text-8xl mb-4 leading-tight whitespace-pre-wrap"
                >
                    {content.title}
                </motion.h1>
                {content.subtitle && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-white/60 text-sm md:text-base tracking-widest uppercase mt-4 mb-12 max-w-lg"
                    >
                        {content.subtitle}
                    </motion.p>
                )}
                {content.ctaText && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <Link href={content.ctaLink || '/'} className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#d8aa5b] text-[#050505] font-display text-sm tracking-widest uppercase breathing-glow hover:bg-white transition-colors duration-500 rounded-sm">
                            {content.ctaText}
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                        </Link>
                    </motion.div>
                )}
            </div>
        </section>
    );
};

const TextImageSection = ({ content }: { content: any }) => {
    const images = content.images || (content.image ? [content.image] : []);

    return (
        <section className="py-32 px-6 bg-[#050505] relative z-20">
            <div className={`container mx-auto flex flex-col ${content.imagePosition === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16`}>
                <div className="flex-1 w-full relative aspect-[4/5] bg-[#111] overflow-hidden rounded-sm group">
                    <UniversalCarousel
                        images={images}
                        className="absolute inset-0"
                        overlayOpacity={0.8}
                        imageClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
                    {content.caption && (
                        <div className="absolute bottom-8 left-8 text-[#d8aa5b] font-display text-2xl max-w-[200px] z-20">
                            "{content.caption}"
                        </div>
                    )}
                </div>
                <div className="flex-1 space-y-8">
                    <h2 className="font-display text-4xl md:text-5xl text-white whitespace-pre-wrap">{content.heading}</h2>
                    <div className="text-gray-400 leading-relaxed max-w-md font-light whitespace-pre-wrap">{content.text}</div>
                </div>
            </div>
        </section>
    );
};

const RichTextSection = ({ content }: { content: any }) => (
    <section className="py-20 px-6 bg-[#050505] text-white">
        <div className="container mx-auto max-w-3xl">
            <div className="prose prose-invert prose-amber max-w-none text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                {content.text}
            </div>
        </div>
    </section>
);

const QuoteSection = ({ content }: { content: any }) => (
    <section className="py-24 px-6 bg-[#0a0a09] relative overflow-hidden">
        <div className="container mx-auto max-w-4xl text-center relative z-10">
            <div className="text-[#d8aa5b] text-6xl font-display mb-8 opacity-20">"</div>
            <blockquote className="font-display text-3xl md:text-5xl text-white mb-8 leading-tight italic">
                {content.text}
            </blockquote>
            {content.author && (
                <cite className="text-[#d8aa5b] text-sm uppercase tracking-[0.3em] font-medium not-italic">
                    — {content.author}
                </cite>
            )}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#d8aa5b] opacity-[0.03] blur-[150px] rounded-full"></div>
    </section>
);

const VideoSection = ({ content }: { content: any }) => (
    <section className="py-20 px-6 bg-[#050505]">
        <div className="container mx-auto max-w-5xl">
            <div className="relative aspect-video bg-[#111] rounded-sm overflow-hidden group cursor-pointer border border-white/5">
                {content.thumbnail ? (
                    <img src={content.thumbnail} alt="Video Thumbnail" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[2000ms]" />
                ) : (
                    <div className="absolute inset-0 bg-[#0a0a0a]"></div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm group-hover:bg-[#d8aa5b] group-hover:border-[#d8aa5b] transition-all duration-500">
                        <Play size={24} className="text-white group-hover:text-black transition-colors ml-1" />
                    </div>
                </div>
                <div className="absolute bottom-8 left-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <span className="text-[#d8aa5b] text-xs uppercase tracking-widest">{content.label || 'Watch Ritual'}</span>
                </div>
            </div>
        </div>
    </section>
);

const FullImageSection = ({ content }: { content: any }) => {
    const images = content.images || (content.image ? [content.image] : []);

    return (
        <section className="w-full bg-[#050505] overflow-hidden py-10">
            <div className="mx-auto container px-0 md:px-6">
                <div className="relative w-full aspect-[21/9] md:aspect-[3/1] overflow-hidden rounded-sm border border-white/5 group">
                    <UniversalCarousel
                        images={images}
                        className="absolute inset-0"
                        overlayOpacity={1}
                        imageClassName="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                    />
                    {content.caption && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                            <div className="text-white font-display text-xl tracking-[0.3em] uppercase border-y border-white/20 py-4 px-8">
                                {content.caption}
                            </div>
                        </div>
                    )}
                </div>
                {content.caption && (
                    <div className="mt-4 px-6 md:px-0 text-gray-500 text-[10px] uppercase tracking-widest italic text-center md:hidden">
                        — {content.caption} —
                    </div>
                )}
            </div>
        </section>
    );
};

const SpacerSection = ({ content }: { content: any }) => (
    <div style={{ height: `${content.height || 60}px` }} className="w-full bg-[#050505]"></div>
);

const PurchaseSection = ({ content, productContext }: { content: any, productContext?: any }) => {
    const { addToCart, toggleCart } = useCart();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [bought, setBought] = useState(false);

    const product = productContext || content.productInfo || { name: 'Unknown Artifact', price: 0, id: 'temp' };

    const handleBuyNow = () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=${window.location.pathname}&action=buynow`);
            return;
        }
        addToCart(product);
        toggleCart();
    };

    const handleAddToCart = () => {
        addToCart(product);
    };

    // Auto-trigger if returning from login
    useEffect(() => {
        if (isAuthenticated && searchParams.get('action') === 'buynow' && !bought) {
            setBought(true);
            addToCart(product);
            toggleCart();
            // Clean URL
            router.replace(window.location.pathname);
        }
    }, [isAuthenticated, searchParams, product, addToCart, toggleCart, router, bought]);

    return (
        <section className="py-24 px-6 bg-[#0a0a09] border-y border-white/5">
            <div className="container mx-auto max-w-4xl text-center">
                <span className="text-[#d8aa5b] text-[10px] uppercase tracking-[0.4em] mb-4 block">Acquire Artifact</span>
                <h2 className="font-display text-4xl md:text-6xl text-white mb-4">{product.name}</h2>
                <p className="text-[#d8aa5b] font-display text-2xl mb-12">${product.price}</p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    <button
                        onClick={handleAddToCart}
                        className="group relative flex items-center gap-3 px-12 py-5 border border-white/10 text-white font-display text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-500 rounded-sm w-full md:w-auto"
                    >
                        <ShoppingBag size={18} className="opacity-50 group-hover:opacity-100" />
                        Add to Ritual
                    </button>

                    <button
                        onClick={handleBuyNow}
                        className="group relative flex items-center gap-3 px-12 py-5 bg-[#d8aa5b] text-black font-display text-sm tracking-widest uppercase hover:bg-white transition-all duration-500 rounded-sm w-full md:w-auto overflow-hidden shadow-[0_0_30px_rgba(216,170,91,0.2)]"
                    >
                        <Zap size={18} />
                        Buy Now
                        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-black/20 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    </button>
                </div>

                <p className="mt-8 text-gray-500 text-[10px] uppercase tracking-widest opacity-50 italic">
                    — Secure transaction via SØMNUS Vault —
                </p>
            </div>
        </section>
    );
};

const SectionWrapper = ({ section, children }: { section: Section, children: React.ReactNode }) => {
    const bg = section.backgroundConfig;

    return (
        <div className="relative overflow-hidden w-full min-h-[10vh]">
            {/* Background Layer */}
            {bg && bg.url && (
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: bg.opacity ?? 1 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                        filter: `blur(${bg.blur ?? 0}px)`,
                    }}
                >
                    {bg.type === 'video' ? (
                        <video
                            src={bg.url}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <img
                            src={bg.url}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    )}

                    {/* Film Grain Overlay */}
                    {(bg.grain || 0) > 0 && (
                        <div
                            className="absolute inset-0 mix-blend-overlay pointer-events-none grain-overlay"
                            style={{ opacity: (bg.grain || 0) / 100 }}
                        ></div>
                    )}
                </motion.div>
            )}

            {/* Content Layer */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
};

// --- Main Renderer ---

export default function SectionRenderer({ sections, productContext }: { sections: Section[], productContext?: any }) {
    if (!sections || sections.length === 0) return null;

    return (
        <div className="flex flex-col bg-[#050505]">
            {sections.filter(s => s.isEnabled).map((section) => {
                let component;
                switch (section.type) {
                    case 'hero':
                        component = <HeroSection key={section.id} content={section.content} />;
                        break;
                    case 'text-image':
                        component = <TextImageSection key={section.id} content={section.content} />;
                        break;
                    case 'rich-text':
                        component = <RichTextSection key={section.id} content={section.content} />;
                        break;
                    case 'quote':
                        component = <QuoteSection key={section.id} content={section.content} />;
                        break;
                    case 'video':
                        component = <VideoSection key={section.id} content={section.content} />;
                        break;
                    case 'full-image':
                        component = <FullImageSection key={section.id} content={section.content} />;
                        break;
                    case 'spacer':
                        component = <SpacerSection key={section.id} content={section.content} />;
                        break;
                    case 'purchase':
                        component = <PurchaseSection key={section.id} content={section.content} productContext={productContext} />;
                        break;
                    default:
                        component = <div key={section.id} className="p-10 text-center text-white/20 border border-dashed border-white/10 my-10 mx-auto container">Unknown Block Type: {section.type}</div>;
                }

                return (
                    <SectionWrapper key={section.id} section={section}>
                        {component}
                    </SectionWrapper>
                );
            })}
        </div>
    );
}
