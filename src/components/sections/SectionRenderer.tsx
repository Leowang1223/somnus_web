'use client';

import { Section } from "@/types/cms";
import { motion, AnimatePresence, useScroll, useSpring, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play, ShoppingBag, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

// --- Side Navigation Component ---
const SideNavigation = ({ sections, activeIndex, onDotClick }: { sections: Section[], activeIndex: number, onDotClick: (i: number) => void }) => {
    return (
        <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
            {sections.map((section, i) => (
                <button
                    key={section.id}
                    onClick={() => onDotClick(i)}
                    className="group relative flex items-center justify-end"
                >
                    <span className={`absolute right-8 text-[10px] uppercase tracking-[0.3em] font-bold text-[#d8aa5b] opacity-0 group-hover:opacity-100 transition-all duration-500 whitespace-nowrap ${i === activeIndex ? 'translate-x-0' : 'translate-x-4'}`}>
                        {section.content?.label || section.type}
                    </span>
                    <div className={`h-2 rounded-full transition-all duration-700 ${i === activeIndex ? 'w-8 bg-[#d8aa5b] shadow-[0_0_15px_rgba(216,170,91,0.6)]' : 'w-2 bg-white/10 group-hover:bg-white/30'}`} />
                </button>
            ))}
        </div>
    );
};

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
            {/* Render all images with explicit visibility control */}
            {images.map((img, i) => {
                const isActive = i === index;
                return (
                    <img
                        key={i}
                        src={img}
                        alt=""
                        className={`absolute inset-0 w-full h-full object-cover ${imageClassName}`}
                        style={{
                            opacity: isActive ? 1 : 0,
                            zIndex: isActive ? 15 : 1,
                            transition: 'opacity 1000ms ease-in-out',
                            display: 'block',
                            visibility: 'visible',
                            pointerEvents: 'none'
                        }}
                        draggable={false}
                        onLoad={() => console.log(`✅ Carousel image ${i} loaded:`, img)}
                        onError={(e) => console.error(`❌ Carousel image ${i} failed:`, img, e)}
                    />
                );
            })}

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
// --- Section Components ---

const HeroSection = ({ content, isInView }: { content: any, isInView?: boolean }) => {
    const images = content.backgroundImages || (content.backgroundImage ? [content.backgroundImage] : []);

    return (
        <section className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[radial-gradient(circle,_rgba(216,170,91,0.15)_0%,_transparent_70%)] blur-[100px] z-0 animate-pulse duration-[8000ms]"></div>

            <UniversalCarousel
                images={images}
                className="absolute inset-0 z-[-1]"
                overlayOpacity={0.5}
            />

            <div
                className={`relative z-20 flex flex-col px-6 md:px-24 transition-all duration-700`}
                style={{
                    width: '100%',
                    maxWidth: `${content.containerWidth || 95}vw`,
                    textAlign: content.textAlign || 'center',
                    alignItems: content.textAlign === 'left' ? 'flex-start' : content.textAlign === 'right' ? 'flex-end' : 'center',
                    marginLeft: content.textAlign === 'left' ? '0' : content.textAlign === 'right' ? 'auto' : 'auto',
                    marginRight: content.textAlign === 'right' ? '0' : content.textAlign === 'left' ? 'auto' : 'auto',
                } as React.CSSProperties}
            >
                {/* Background Glow Layer for Text */}
                {content.enableTitleBgGlow && (
                    <div
                        className="absolute inset-0 z-0 pointer-events-none bg-breathing-glow rounded-full blur-[100px]"
                        style={{
                            backgroundColor: content.titleBgGlowColor || 'rgba(216, 170, 91, 0.1)',
                            '--glow-color': content.titleBgGlowColor || 'rgba(216, 170, 91, 0.4)'
                        } as React.CSSProperties}
                    />
                )}

                <h1
                    className={`font-display text-5xl md:text-8xl mb-4 leading-tight whitespace-pre-wrap relative z-10 reveal-text ${isInView ? 'active' : ''} ${content.enableTitleGlow ? 'text-breathing-glow' : ''}`}
                    style={{
                        color: content.titleColor || '#ffffff',
                        '--glow-color': content.titleGlowColor || 'rgba(216, 170, 91, 0.4)'
                    } as React.CSSProperties}
                >
                    {content.title}
                </h1>
                {content.subtitle && (
                    <p
                        className={`text-sm md:text-base tracking-widest uppercase mt-4 mb-12 max-w-2xl relative z-10 reveal-text delay-1 ${isInView ? 'active' : ''}`}
                        style={{ color: content.subtitleColor || '#ffffff', opacity: content.subtitleColor ? 1 : 0.7 }}
                    >
                        {content.subtitle}
                    </p>
                )}
                {content.ctaText && (
                    <div
                        className={`relative z-10 reveal-text delay-2 ${isInView ? 'active' : ''}`}
                    >
                        <Link
                            href={content.ctaLink || '/'}
                            className={`group relative inline-flex items-center gap-3 px-8 py-4 bg-[#d8aa5b] text-[#050505] font-display text-sm tracking-widest uppercase hover:bg-white transition-all duration-500 rounded-sm ${content.enableGlow ? 'breathing-glow' : ''}`}
                            style={{
                                '--glow-color': content.glowColor || 'rgba(216, 170, 91, 0.4)'
                            } as React.CSSProperties}
                        >
                            {content.ctaText}
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
};

const TextImageSection = ({ content, isInView }: { content: any, isInView?: boolean }) => {
    const images = content.images || (content.image ? [content.image] : []);

    return (
        <section className="py-32 px-6 bg-[#050505] relative z-20">
            <div className={`container mx-auto flex flex-col ${content.imagePosition === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-12 lg:gap-16`}>
                {/* Image - Fixed/Max Width */}
                <div className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0 relative aspect-[4/5] bg-[#111] overflow-hidden rounded-sm group">
                    {/* Image Layer - z-10 */}
                    <div className="absolute inset-0 z-10">
                        <UniversalCarousel
                            images={images}
                            className="w-full h-full"
                            overlayOpacity={1}
                            imageClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                    </div>

                    {/* Caption Layer - z-20 (above image) */}
                    {content.caption && (
                        <div className={`absolute bottom-8 left-8 text-[#d8aa5b] font-display text-2xl max-w-[200px] z-20 reveal-text ${isInView ? 'active' : ''}`}>
                            "{content.caption}"
                        </div>
                    )}
                </div>

                {/* Text - Flexible, expands as needed */}
                <div
                    className={`flex-grow min-w-0 space-y-6 md:space-y-8 flex flex-col`}
                    style={{
                        textAlign: content.textAlign || (content.imagePosition === 'right' ? 'left' : 'left'),
                        alignItems: content.textAlign === 'center' ? 'center' : content.textAlign === 'right' ? 'flex-end' : 'flex-start'
                    } as React.CSSProperties}
                >
                    <h2
                        className={`font-display text-4xl md:text-5xl lg:text-6xl text-white whitespace-pre-wrap reveal-text ${isInView ? 'active' : ''}`}
                        style={{ lineHeight: '1.2' }}
                    >
                        {content.heading}
                    </h2>
                    <div
                        className={`text-gray-400 text-base md:text-lg leading-relaxed font-light whitespace-pre-wrap reveal-text delay-1 ${isInView ? 'active' : ''}`}
                        style={{ lineHeight: '1.8' }}
                    >
                        {content.text}
                    </div>
                </div>
            </div>
        </section>
    );
};

const RichTextSection = ({ content, isInView }: { content: any, isInView?: boolean }) => (
    <section
        className="py-12 px-6 bg-transparent"
        style={{ textAlign: content.textAlign || 'center' } as React.CSSProperties}
    >
        <div className={`w-full flex flex-col ${content.textAlign === 'left' ? 'items-start' : content.textAlign === 'right' ? 'items-end' : 'items-center'} reveal-text ${isInView ? 'active' : ''}`}>
            <div className="max-w-4xl text-gray-400 leading-relaxed font-light text-lg whitespace-pre-wrap w-full">
                {content.text}
            </div>
        </div>
    </section>
);

const QuoteSection = ({ content, isInView }: { content: any, isInView?: boolean }) => (
    <section
        className="py-24 px-6 bg-transparent relative overflow-hidden"
        style={{ textAlign: content.textAlign || 'center' } as React.CSSProperties}
    >
        <div className={`w-full flex flex-col ${content.textAlign === 'left' ? 'items-start' : content.textAlign === 'right' ? 'items-end' : 'items-center'} relative z-10`}>
            <div className="max-w-4xl w-full">
                <div className={`text-[#d8aa5b] mb-12 reveal-text ${isInView ? 'active' : ''}`}>
                    <Zap size={48} className={`opacity-20 ${content.textAlign === 'left' ? 'mr-auto' : content.textAlign === 'right' ? 'ml-auto' : 'mx-auto'}`} />
                </div>
                <blockquote className={`font-display text-3xl md:text-5xl text-white leading-tight mb-12 italic reveal-text delay-1 ${isInView ? 'active' : ''}`}>
                    "{content.text}"
                </blockquote>
                {content.author && (
                    <div className={`text-[#d8aa5b] uppercase tracking-[0.3em] text-xs font-bold reveal-text delay-2 ${isInView ? 'active' : ''}`}>
                        — {content.author} —
                    </div>
                )}
            </div>
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

const PurchaseSection = ({ content, productContext, isInView }: { content: any, productContext?: any, isInView?: boolean }) => {
    const { addToCart, toggleCart } = useCart();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [bought, setBought] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);

    const product = productContext || content.productInfo || { name: 'Unknown Artifact', price: 0, id: 'temp' };
    const images = content.images || (product.image ? [product.image] : []);
    const featureCards = content.featureCards || [];
    const infoList = content.infoList || [];
    const variants = product.variants || [];

    // Auto-select first variant if available
    useEffect(() => {
        if (variants && variants.length > 0 && !selectedVariant) {
            setSelectedVariant(variants[0]);
        }
    }, [variants]);

    // CRITICAL DEBUG: Track component lifecycle
    useEffect(() => {
        console.log("═══ PurchaseSection Mounted ═══");
        console.log("Product:", product.name);
        console.log("Variants found:", variants);

        (window as any).emergencyAddToCart = () => {
            addToCart(product, selectedVariant);
        };
    }, [product, addToCart, selectedVariant]);

    const handleBuyNow = (e?: React.MouseEvent) => {
        e?.preventDefault(); e?.stopPropagation();
        if (variants.length > 0 && !selectedVariant) {
            alert("Please select an option.");
            return;
        }
        addToCart(product, selectedVariant);
        toggleCart();
    };

    const handleAddToCart = (e?: React.MouseEvent) => {
        e?.preventDefault(); e?.stopPropagation();
        if (variants.length > 0 && !selectedVariant) {
            alert("Please select an option.");
            return;
        }
        addToCart(product, selectedVariant);
        toggleCart();
    };

    useEffect(() => {
        if (isAuthenticated && searchParams.get('action') === 'buynow' && !bought) {
            setBought(true);
            addToCart(product, selectedVariant);
            toggleCart();
            router.replace(window.location.pathname);
        }
    }, [isAuthenticated, searchParams, product, addToCart, toggleCart, router, bought, selectedVariant]);

    return (
        <section className="w-full h-full flex items-center justify-center bg-[#050505] py-24 md:py-0">
            <div className="container mx-auto px-6 h-full flex flex-col md:flex-row items-center gap-12 md:gap-24">
                {/* Left: Enhanced Image/Carousel */}
                <div className="flex-1 w-full h-[60vh] md:h-[80vh] relative group">
                    <div className="absolute -inset-4 bg-[#d8aa5b]/5 blur-3xl opacity-30 group-hover:opacity-60 transition-opacity duration-1000"></div>
                    <div className="relative w-full h-full overflow-hidden rounded-sm border border-white/5 bg-[#0a0a0a]">
                        <UniversalCarousel
                            images={images.length > 0 ? images : ['https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?q=80&w=1000']}
                            className="absolute inset-0"
                            overlayOpacity={0.9}
                            imageClassName="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Right: Product Details */}
                <div className="flex-1 flex flex-col items-start text-left">
                    <span className="text-[#d8aa5b] text-[10px] uppercase tracking-[0.5em] mb-4 font-bold opacity-60">
                        {content.label || (product.category ? `${product.category} Collection` : 'Ritual Artifact')}
                    </span>
                    <h2 className="font-display text-4xl md:text-7xl text-white mb-6 leading-tight">
                        {product.name}
                    </h2>
                    <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-10 max-w-xl font-light">
                        {content.description || product.description || 'A cinematic descent into stillness. Elevate your sleep ritual with our signature collection designed to bridge the gap between day and dreams.'}
                    </p>

                    {/* Variant Selector */}
                    {variants.length > 0 && (
                        <div className="mb-10 w-full">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-4 font-bold">Select Variation</span>
                            <div className="flex flex-wrap gap-3">
                                {variants.map((v: any, idx: number) => (
                                    <button
                                        key={v.id || idx}
                                        onClick={() => setSelectedVariant(v)}
                                        className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 ${selectedVariant?.id === v.id
                                            ? 'bg-[#d8aa5b] border-[#d8aa5b] text-black shadow-[0_0_15px_rgba(216,170,91,0.3)]'
                                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white'
                                            }`}
                                    >
                                        {v.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-12 w-full mb-12">
                        <div>
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-2 font-bold">Investment</span>
                            <span className="text-[#d8aa5b] font-display text-3xl md:text-4xl leading-none">
                                ${product.price}
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full" style={{ position: 'relative', zIndex: 9999 }}>
                            <button
                                type="button"
                                onClick={handleAddToCart}
                                className="flex-1 group relative flex items-center justify-center gap-4 px-8 py-5 bg-white text-black font-display text-[10px] tracking-[0.2em] uppercase hover:bg-[#d8aa5b] transition-all duration-700 rounded-sm cursor-pointer"
                                style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10000 }}
                            >
                                <span>Add to Ritual</span>
                                <ShoppingBag size={14} />
                            </button>

                            <button
                                type="button"
                                onClick={handleBuyNow}
                                className="flex-1 group relative flex items-center justify-center gap-4 px-8 py-5 bg-[#d8aa5b] text-black font-display text-[10px] tracking-[0.2em] uppercase hover:bg-white transition-all duration-700 shadow-[0_0_40px_rgba(216,170,91,0.15)] rounded-sm cursor-pointer"
                                style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10000 }}
                            >
                                <span>Buy Now</span>
                                <Zap size={14} className="fill-current" />
                            </button>
                        </div>
                    </div>

                    {/* Feature Cards Grid */}
                    {featureCards.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 w-full mb-12">
                            {featureCards.map((card: any, idx: number) => (
                                <div key={idx} className="bg-white/[0.03] border border-white/5 p-6 rounded-sm flex flex-col gap-3 group hover:border-[#d8aa5b]/20 transition-all duration-500">
                                    <div className="text-[#d8aa5b] opacity-40 group-hover:opacity-100 transition-opacity">
                                        {card.iconType === 'Scent' ? <Zap size={20} /> : <ShoppingBag size={20} />}
                                    </div>
                                    <div>
                                        <span className="text-[9px] uppercase tracking-widest text-gray-600 block mb-1 font-bold">{card.label}</span>
                                        <span className="text-white text-sm font-medium">{card.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Info List (Repurposed Ritual Steps) */}
                    {infoList.length > 0 && (
                        <div className="w-full border-t border-white/10 pt-10 mt-4 space-y-8">
                            <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold block mb-4">Product Attributes</span>
                            {infoList.map((item: any, idx: number) => (
                                <div key={idx} className="flex gap-6 items-start group">
                                    <span className="text-[#d8aa5b] font-display text-lg opacity-40 leading-none pt-1">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </span>
                                    <div>
                                        <h4 className="text-white text-sm uppercase tracking-widest font-bold mb-2 group-hover:text-[#d8aa5b] transition-colors">{item.title}</h4>
                                        <p className="text-gray-500 text-xs leading-relaxed font-light">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Background Glow Layer for Text - Global Ambient */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[radial-gradient(circle,_rgba(216,170,91,0.05)_0%,_transparent_70%)] blur-[100px] z-0 animate-pulse duration-[10000ms]"></div>
        </section>
    );
};

const SectionWrapper = ({ section, isFirst, noSnap, productContext }: { section: Section, isFirst?: boolean, noSnap?: boolean, productContext?: any }) => {
    const bg = section.backgroundConfig;
    const ref = useRef(null);
    const isInView = useInView(ref, { amount: 0.3, margin: "0px 0px -10% 0px" });

    return (
        <section ref={ref} className={`${noSnap ? 'relative w-full' : 'snap-section relative'} group`}>
            <motion.div
                className={`w-full ${noSnap ? 'min-h-[50vh]' : 'h-full'} relative overflow-hidden`}
                animate={{
                    opacity: isInView ? 1 : 0.95,
                    scale: isInView ? 1 : 1.02
                }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Background Layer */}
                {bg && bg.url && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: bg.opacity ?? 1 }}
                        transition={{ duration: 1.5 }}
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
                <div className={`relative z-10 w-full px-6 md:px-24 ${noSnap ? '' : `h-full flex ${section.type.toLowerCase().includes('rich') ? 'items-start pt-[10vh]' : 'items-center'} ${section.content.textAlign === 'left' ? 'justify-start' : section.content.textAlign === 'right' ? 'justify-end' : 'justify-center'}`}`}>
                    <SectionContent section={section} isInView={isInView} productContext={productContext} />
                </div>
            </motion.div>
        </section>
    );
};

// --- Main Renderer ---

// Helper to dispatch section rendering
const SectionContent = ({ section, isInView, productContext }: { section: Section, isInView?: boolean, productContext?: any }) => {
    switch (section.type) {
        case 'hero':
            return <HeroSection content={section.content} isInView={isInView} />;
        case 'text-image':
            return <TextImageSection content={section.content} isInView={isInView} />;
        case 'rich-text':
        case 'richText':
            return <RichTextSection content={section.content} isInView={isInView} />;
        case 'quote':
            return <QuoteSection content={section.content} isInView={isInView} />;
        case 'video':
            return <VideoSection content={section.content} />;
        case 'full-image':
            return <FullImageSection content={section.content} />;
        case 'spacer':
            return <SpacerSection content={section.content} />;
        case 'purchase':
            return <PurchaseSection content={section.content} productContext={productContext} isInView={isInView} />;
        default:
            return <div className="p-10 text-center text-white/20 border border-dashed border-white/10 my-10 mx-auto container">Unknown Block Type: {section.type}</div>;
    }
};

export default function SectionRenderer({
    sections,
    productContext,
    showNav = true,
    noSnap = false
}: {
    sections: Section[],
    productContext?: any,
    showNav?: boolean,
    noSnap?: boolean
}) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        const height = e.currentTarget.clientHeight;
        const index = Math.round(scrollTop / height);
        if (index !== activeIndex) {
            setActiveIndex(index);
        }
    };

    const scrollToSection = (i: number) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: i * scrollContainerRef.current.clientHeight,
                behavior: 'smooth'
            });
        }
    };

    if (!sections || sections.length === 0) return null;

    const enabledSections = sections.filter(s => s.isEnabled);

    return (
        <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={`${noSnap ? 'bg-[#050505] min-h-screen' : 'snap-container bg-[#050505]'}`}
        >
            {showNav && (
                <SideNavigation
                    sections={enabledSections}
                    activeIndex={activeIndex}
                    onDotClick={scrollToSection}
                />
            )}
            {enabledSections.map((section, idx) => (
                <SectionWrapper
                    key={section.id}
                    section={section}
                    isFirst={idx === 0}
                    noSnap={noSnap}
                    productContext={productContext}
                />
            ))}
        </div>
    );
}
