import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import React, { useRef } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sprout } from "lucide-react";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Sphere } from "@react-three/drei"
import { EarthSphere, FloatingParticles, FlyingConnections } from "@/components/Globe3D";


const Home: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null)
    const cardSectionRef = useRef<HTMLDivElement>(null)

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
                            <Button className="bg-blue-950 hover:bg-blue-500 text-white px-8 py-6 text-lg font-semibold rounded-lg">
                                Start Building  →
                            </Button>
                        </motion.div>
                        
                        {/* 3D Globe Decoration */}
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                            className="hidden lg:flex justify-center items-center absolute right-0 top-16 w-[60rem] h-[50rem] z-0 overflow-x-hidden"
                        >
                            <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
                                <ambientLight intensity={0.3} />
                                {/* <pointLight position={[-10, -10, -10]} intensity={200} color="#4f46e5" />
                                <pointLight position={[10, 10, 10]} intensity={200} color="#4f46e5" /> */}

                                {/* Atmosphere glow */}
                                <Sphere args={[1.3, 64, 64]}>
                                    <meshBasicMaterial color="#4f46e5" transparent opacity={0.1} side={THREE.BackSide} />
                                </Sphere>

                                <EarthSphere />
                                <FlyingConnections />
                                <FloatingParticles />

                                <OrbitControls
                                    autoRotate
                                    autoRotateSpeed={1}
                                    enableZoom={false}
                                    enablePan={false}
                                    minDistance={2}
                                    maxDistance={6}
                                />
                            </Canvas>
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

            {/* Brand Features Section */}
            <section className="px-6 py-20 bg-white relative z-30 mt-[-1.5rem]">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-16 justify-center"
                    >
                        <h2 className="text-4xl font-bold text-slate-800 mb-4">SUDAO Makes Great DAOs</h2>
                        <p className="text-slate-600 text-lg max-w-2xl mx-auto">From transparent governance and fair funding to community-focused support, SUDAO helps movements of any size grow and thrive.</p>
                    </motion.div>

                    <motion.div
                        initial="initial"
                        whileInView="animate"
                        className="grid md:grid-cols-3 gap-8"
                    >
                        <motion.div
                            variants={fadeInUp}
                            whileHover={{ y: -10 }}
                            className="bg-gradient-to-b from-blue-900 via-blue-900 to-blue-900/85 text-white backdrop-blur-sm border border-slate-400 rounded-2xl p-8 pt-12 text-center transition-all duration-300"
                        >
                            <div className="w-full mx-auto mb-[-1rem] flex items-center justify-center">
                                <img
                                    src="/src/assets/images/b_1.png"
                                    alt="Icon"
                                    className="w-60"
                                />
                            </div>
                            <h3 className="text-xl font-semibold mb-4">Transparent Treasury</h3>
                            <p className="font-normal leading-relaxed">All transactions are on-chain <br></br>and open to everyone.</p>
                        </motion.div>
                        <motion.div
                            variants={fadeInUp}
                            whileHover={{ y: -10 }}
                            className="bg-gradient-to-b from-blue-900 via-blue-900 to-blue-900/85 text-white backdrop-blur-sm border border-slate-400 rounded-2xl p-8 pt-0 text-center transition-all duration-300"
                        >
                            <div className="w-full mx-auto mb-[-2rem] flex items-center justify-center">
                                <img
                                    src="/src/assets/images/b_2.png"
                                    alt="Icon"
                                    className="w-72"
                                />
                            </div>
                            <h3 className="text-xl font-semibold mb-4">Collective Governance</h3>
                            <p className="font-normal leading-relaxed">Propose, vote, and execute together.</p>
                        </motion.div>
                        <motion.div
                            variants={fadeInUp}
                            whileHover={{ y: -10 }}
                            className="bg-gradient-to-b from-blue-900 via-blue-900 to-blue-900/85 text-white backdrop-blur-sm border border-slate-400 rounded-2xl p-8 pt-12 text-center transition-all duration-300"
                        >
                            <div className="w-full mx-auto mb-5 flex items-center justify-center">
                                <img
                                    src="/src/assets/images/b_3.png"
                                    alt="Icon"
                                    className="w-60"
                                />
                            </div>
                            <h3 className="text-xl font-semibold mb-4">Plugin Ecosystem</h3>
                            <p className="font-normal leading-relaxed">Extend your DAO with powerful tools, made by the community.</p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Advanced Features Section */}
            <motion.section className="px-6 py-20 pb-32 bg-gradient-to-r from-blue-950 to-blue-900">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <h2 className="text-7xl md:text-5xl font-bold bg-gradient-to-r from-[#71AAC6] via-blue-100 to-white bg-clip-text text-transparent mb-4 leading-tight">
                            OUR FEATURES ARE
                            <br />
                            MADE FOR YOU
                        </h2>
                        <p className="text-slate-300 text-lg">
                        We created these features for you to reach from the tip of your fingers
                        </p>
                    </motion.div>

                    <div className="flex flex-col space-y-6 text-slate-50">
                        <div className="flex flex-row space-x-6 w-full">
                            <motion.div
                                initial={{ opacity: 0, x: -40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.02 }}
                                className="w-[65%] h-[18rem] bg-gradient-to-l from-blue-950 to-blue-900 backdrop-blur-sm border border-slate-700 rounded-2xl p-10 hover:bg-slate-800/70 transition-all duration-300 relative overflow-hidden group"
                            >
                                <h1 className="font-bold text-2xl pb-1">COMMENTS AND DISCUSSIONS</h1>
                                <p>Engage your members via built‑in conversation tools</p>
                                
                                {/* Left decorative image */}
                                <motion.img
                                    src="/src/assets/images/c1_2.png"
                                    alt="Chat interface"
                                    className="absolute bottom-8 left-12 w-[16rem] h-auto opacity-70"
                                    initial={{ y: 20, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 0.8 }}
                                    whileHover={{ y: -5, opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                                
                                {/* Right decorative image */}
                                <motion.img
                                    src="/src/assets/images/c1_1.png"
                                    alt="Chat bubbles"
                                    className="absolute bottom-0 right-4 w-[32rem] h-auto opacity-80"
                                    initial={{ y: 20, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 0.8 }}
                                    whileHover={{ y: -5, opacity: 1, scale: 1.05 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.02 }}
                                className="w-[35%] bg-slate-950 h-[18rem] backdrop-blur-sm border border-slate-700 rounded-2xl p-10 transition-all duration-300 relative overflow-hidden group"
                            >
                                {/* Blurry circle decoration */}
                                <div className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-br from-blue-800 to-blue-700 rounded-full blur-xl opacity-60"></div>
                                
                                <h1 className="font-bold text-xl pb-1 z-20 relative">NOTIFICATIONS</h1>
                                <h3 className="z-20 relative">Keep everyone in the loop—proposal updates, new funds, votes.</h3>

                                {/* Left decorative image */}
                                <motion.img
                                    src="/src/assets/images/c2_1.png"
                                    alt="Chat interface"
                                    className="absolute bottom-4 left-8 w-[22rem] h-auto opacity-70"
                                    initial={{ y: 20, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 0.8 }}
                                    whileHover={{ y: -5, opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                                
                                {/* Right decorative image */}
                                <motion.img
                                    src="/src/assets/images/c2_2.png"
                                    alt="Chat bubbles"
                                    className="absolute bottom-0 right-0 w-[6rem] h-auto opacity-80"
                                    initial={{ y: 20, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 0.8 }}
                                    whileHover={{ y: -5, opacity: 1, scale: 1.05 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                />
                            </motion.div>
                        </div>
                        <div className="flex flex-row space-x-6">
                            <motion.div
                                initial={{ opacity: 0, x: -40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.02 }}
                                className="w-[35%] bg-blue-950 h-[18rem] backdrop-blur-sm border border-slate-700 rounded-2xl p-10 transition-all duration-300 relative overflow-hidden group"
                            >
                                <h1 className="font-bold text-xl pb-1 z-20 relative">MOBILE-FRIENDLY</h1>
                                <h3 className="z-20 relative">DAO management anywhere, on any device.</h3>

                                {/* Blurry circle decoration */}
                                <div className="absolute -bottom-20 center w-80 h-80 bg-gradient-to-br from-blue-800 to-blue-700 rounded-full blur-xl opacity-70"></div>
                                <div className="absolute -top-12 right-12 w-40 h-40 bg-gradient-to-br from-blue-800 to-blue-700 rounded-full blur-xl opacity-40"></div>

                                {/* Left decorative image */}
                                <motion.img
                                    src="/src/assets/images/c3.png"
                                    alt="Chat interface"
                                    className="absolute bottom-0 center w-[22rem] h-auto opacity-70"
                                    initial={{ y: 20, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 0.8 }}
                                    whileHover={{ y: 5, opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: 40 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                viewport={{ once: true }}
                                whileHover={{ scale: 1.02 }}
                                className="w-[65%] h-[18rem] bg-gradient-to-l from-blue-950 to-blue-900 backdrop-blur-sm border border-slate-700 rounded-2xl p-10 transition-all duration-300 relative overflow-hidden group"
                            >
                                {/* Blurry circle decoration */}
                                <div className="absolute -bottom-16 -left-20 w-60 h-60 bg-gradient-to-tr from-blue-400 to-blue-300 rounded-full blur-xl opacity-80"></div>
                                
                                <h1 className="font-bold text-xl pb-1 z-20 relative">FULL STATISTICS</h1>
                                <h3 className="z-20 relative">Easy dashboard with Treasury health,</h3>
                                <h3 className="z-20 relative">vote turnout, and member data.</h3>

                                {/* Left decorative image */}
                                <motion.img
                                    src="/src/assets/images/c4_1.png"
                                    alt="Chat interface"
                                    className="absolute bottom-4 left-12 w-[18rem] h-auto opacity-70"
                                    initial={{ y: 20, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 0.8 }}
                                    whileHover={{ y: -5, opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                                
                                {/* Right decorative image */}
                                <motion.img
                                    src="/src/assets/images/c4_2.png"
                                    alt="Chat bubbles"
                                    className="absolute bottom-0 right-0 w-[30rem] h-auto opacity-80"
                                    initial={{ y: 20, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 0.8 }}
                                    whileHover={{ y: -5, opacity: 1, scale: 1.05 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Internet Computer Section */}
            <section className="px-6 py-20 bg-blue-800">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-3xl p-12 py-16 text-center shadow-2xl"
                    >
                        <div className="flex items-center justify-center mb-8">
                            <div className="flex items-center space-x-4">
                                <img
                                    src="/src/assets/images/logo_ic.png"
                                    alt="Logo Internet Computer"
                                    className="w-[32rem] h-auto"
                                />
                            </div>
                        </div>

                        <h3 className="text-3xl font-bold text-slate-800 mb-4">BUILT ON THE INTERNET COMPUTER PROTOCOL</h3>

                        <p className="text-slate-600 leading-relaxed mb-8 max-w-4xl mx-auto">
                            ICP enables your DAO to run entirely on-chain using canister smart contracts, offering web-speed
                            performance, predictable cost structure, and environmental efficiency. Plus, governance is handled through
                            the Network Nervous System (NNS), the world's largest DAO that manages the entire Internet Computer
                            blockchain, ensuring your DAO operates with the highest standards of decentralized governance and
                            security.
                        </p>

                        <Button 
                            onClick={() => window.open("https://internetcomputer.org", "_blank")}
                            className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-lg">
                            Learn More About ICP
                        </Button>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-blue-900">
                <div className="mx-auto text-center">
                    <div className="relative overflow-hidden py-20 pb-36 w-full">
                        <div className="absolute -top-[25rem] left-[20rem] w-[48rem] h-[48rem] bg-gradient-to-b to-[#0053B9] from-[#002553] rounded-full blur-3xl opacity-80"></div>

                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight relative z-20">
                            READY TO LAUNCH
                            <br />
                            <span>YOUR MOVEMENT WITH DAO?</span>
                        </h2>

                        <p className="text-slate-300 text-lg mb-12 leading-relaxed relative z-20">
                            Create a transparent, community-powered organization today—with no code, no setup hassles.
                        </p>

                        {/* Window Light Effect */}
                        <motion.img
                            src="/src/assets/images/window.png"
                            alt="Window"
                            className="absolute center bottom-0 w-[90rem] h-auto"
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        />
                    </div>
                </div>
            </section>
        </div>
    )
};

export default Home;
