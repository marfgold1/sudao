import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import React, { useRef, useState, useEffect, lazy, Suspense } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sprout } from "lucide-react";
import { Link } from "react-router-dom";

// Lazy load heavy components
const LazyGlobe3D = lazy(() => import("@/components/LazyGlobe3D"));

// Lazy load non-critical sections
const BrandFeaturesSection = lazy(() => import("@/components/sections/BrandFeaturesSection"));
const AdvancedFeaturesSection = lazy(() => import("@/components/sections/AdvancedFeaturesSection"));
const InternetComputerSection = lazy(() => import("@/components/sections/InternetComputerSection"));
const CTASection = lazy(() => import("@/components/sections/CTASection"));

const Home: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null)
    const cardSectionRef = useRef<HTMLDivElement>(null)
    const [globeVisible, setGlobeVisible] = useState(false)
    const [sectionsVisible, setSectionsVisible] = useState(false)

    // Progressive loading - load globe after initial render
    useEffect(() => {
        const timer = setTimeout(() => setGlobeVisible(true), 100);
        const sectionsTimer = setTimeout(() => setSectionsVisible(true), 500);
        return () => {
            clearTimeout(timer);
            clearTimeout(sectionsTimer);
        };
    }, []);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    })

    // Card section specific scroll progress
    const { scrollYProgress: cardScrollProgress } = useScroll({
        target: cardSectionRef,
        offset: ["start end", "end start"],
    })

    // Card section animations - more dramatic
    const cardScale = useTransform(cardScrollProgress, [0, 0.3, 0.7, 1], [0.7, 1, 1, 1])
    const cardOpacity = useTransform(cardScrollProgress, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.8])
    const heroOpacityRem = useTransform(cardScrollProgress, [0, 0.2, 0.4, 0.8, 1], [1, 1, 0.1, 0.1, 0.1])
    const cardRotate = useTransform(cardScrollProgress, [0, 0.3, 0.7, 1], [2, 0, 0, -1])

    // Glow effect intensity
    const glowIntensity = useTransform(cardScrollProgress, [0.1, 0.4, 0.6, 0.9], [0, 1, 1, 0.5])

    // Parallax transforms
    const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100])
    const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.8])

    const fadeInUp = {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 },
    }

    const faqs = [
        {
            question: "What is a DAO?",
            answer:
                "A Decentralized Autonomous Organization (DAO) is a community-led organization governed by transparent rules written in code, run collectively by a core team. Members make decisions about the future of the project through key stakeholder.",
        },
        {
            question: "Who owns and controls the DAO?",
            answer: "The DAO is owned and controlled by its members through democratic governance and voting mechanisms.",
        },
        {
            question: "How is funding and spending tracked?",
            answer:
                "All funding and spending is tracked transparently on the blockchain, ensuring complete visibility and accountability.",
        },
    ]

    return (
        <div ref={containerRef} className="min-h-screen bg-gradient-to-b from-blue-900 to-[#0021A0] overflow-x-hidden">
            {/* Hero Section */}
            <motion.section style={{ y: heroY, opacity: heroOpacity }} className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center">
                        <motion.div 
                            {...fadeInUp} 
                            style={{
                                opacity: heroOpacityRem,
                            }}
                            className="max-w-5xl relative z-10 pt-20"
                        >
                            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6 tracking-tight">
                                Build 
                                <br />
                                Your Community
                                <br />
                                in Seconds
                            </h1>
                            <p className="text-xl text-white/[74%] mb-8 max-w-3xl leading-relaxed">
                                Launch a transparent and community-owned organization
                                <br />
                                with Decentralized Autonomous Organizations.
                            </p>
                            <Link to={"/discover"}>
                                <Button className="bg-blue-950 hover:bg-blue-500 text-white px-8 py-6 text-lg font-semibold rounded-lg">
                                    Start Building  →
                                </Button>
                            </Link>
                        </motion.div>
                        
                        {/* 3D Globe Decoration - Lazy Loaded */}
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                            className="hidden lg:flex justify-center items-center absolute right-0 top-16 w-[60rem] h-[50rem] z-0 overflow-x-hidden"
                        >
                            <Suspense fallback={
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 animate-pulse"></div>
                                </div>
                            }>
                                <LazyGlobe3D isVisible={globeVisible} />
                            </Suspense>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* DAO Explanation Card - Enhanced with dramatic scaling and glow */}
            <section ref={cardSectionRef} className="px-6 py-2 mt-[-4rem] relative">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        style={{
                            scale: cardScale,
                            opacity: cardOpacity,
                            rotateX: cardRotate,
                        }}
                        className="relative"
                    >
                        {/* Glow effect wrapper */}
                        <motion.div
                            style={{
                                filter: useTransform(
                                    glowIntensity,
                                    [0, 1],
                                    ["drop-shadow(0 0 0px rgba(56, 189, 248, 0))", "drop-shadow(0 0 60px rgba(56, 189, 248, 0.6))"],
                                ),
                            }}
                            className="relative"
                        >
                            {/* Animated border glow */}
                            <motion.div
                                style={{
                                    opacity: glowIntensity,
                                }}
                                className="absolute -inset-1 rounded-[2rem] blur-lg"
                            />
                                <div className="relative bg-white/80 rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20">
                                    <div className="grid md:grid-cols-2 gap-12 items-start">
                                        <div>
                                            <motion.div
                                                initial={{ opacity: 0, x: -50 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.8, delay: 0.2 }}
                                                viewport={{ once: true }}
                                                className="flex items-start space-x-3 mb-8"
                                            >
                                                <div className="w-12 h-12 bg-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                                                    <Sprout className="text-white"/>
                                                </div>
                                                <h2 className="text-2xl font-bold text-blue-800 leading-tight">
                                                    WHERE MOVEMENT ARE
                                                    <br />
                                                    OWNED TOGETHER
                                                </h2>
                                            </motion.div>

                                            <Accordion type="single" collapsible defaultValue="item-0" className="space-y-1 h-64">
                                                {faqs.map((faq, index) => (
                                                    <motion.div
                                                        key={index}
                                                        initial={{ opacity: 0, x: -30 }}
                                                        whileInView={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                                                        viewport={{ once: true }}
                                                    >
                                                        <AccordionItem value={`item-${index}`} className="border-b border-slate-300 last:border-b-0">
                                                            <AccordionTrigger className="flex items-center justify-between w-full text-left py-4 hover:bg-white/50 px-2 rounded transition-all duration-300 hover:shadow-sm font-medium text-slate-800 text-sm [&[data-state=open]>svg]:rotate-180">
                                                                {faq.question}
                                                            </AccordionTrigger>
                                                            <AccordionContent className="pb-4 px-2 text-slate-600 text-sm leading-relaxed data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                                                                {faq.answer}
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </motion.div>
                                                ))}
                                            </Accordion>

                                        </div>

                                        <motion.div
                                            initial={{ opacity: 0, x: 50 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.8, delay: 0.3 }}
                                            viewport={{ once: true }}
                                            className="bg-white rounded-2xl p-8 pb-20 shadow-xl border border-slate-200"
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-lg font-semibold text-slate-800">Your Incredible Movement</h3>
                                                <div className="flex space-x-1">
                                                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="h-52 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center shadow-inner">
                                                    <span className="text-slate-500 text-sm">Preview Area</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {[1, 2, 3].map((i) => (
                                                        <motion.div
                                                            key={i}
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: `${100 - i * 15}%` }}
                                                            transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                                                            viewport={{ once: true }}
                                                            className="h-3 bg-slate-200 rounded animate-pulse"
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Brand Features Section - Lazy Loaded */}
            {sectionsVisible && (
                <Suspense fallback={<div className="h-96 bg-white animate-pulse"></div>}>
                    <BrandFeaturesSection />
                </Suspense>
            )}

            {/* Advanced Features Section - Lazy Loaded */}
            {sectionsVisible && (
                <Suspense fallback={<div className="h-96 bg-gradient-to-r from-blue-950 to-blue-900 animate-pulse"></div>}>
                    <AdvancedFeaturesSection />
                </Suspense>
            )}

            {/* Internet Computer Section - Lazy Loaded */}
            {sectionsVisible && (
                <Suspense fallback={<div className="h-96 bg-blue-800 animate-pulse"></div>}>
                    <InternetComputerSection />
                </Suspense>
            )}

            {/* CTA Section - Lazy Loaded */}
            {sectionsVisible && (
                <Suspense fallback={<div className="h-96 bg-blue-900 animate-pulse"></div>}>
                    <CTASection />
                </Suspense>
            )}

            
        </div>
    )
};

export default Home;
