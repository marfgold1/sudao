"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Info } from "lucide-react"
import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Link, useParams } from "react-router-dom"
import { useDAO } from "@/hooks/useDAO"

const chartData = [
    { month: "Mar 2025", value: 50, date: "Mar 15, 2025", amount: "50 ICP", change: "+5 ICP" },
    { month: "Apr 2025", value: 75, date: "Apr 20, 2025", amount: "75 ICP", change: "+25 ICP" },
    { month: "May 2025", value: 120, date: "May 18, 2025", amount: "120 ICP", change: "+45 ICP" },
    { month: "Jun 2025", value: 200, date: "Jun 25, 2025", amount: "200 ICP", change: "+80 ICP" },
    { month: "Jul 2025", value: 180, date: "Jul 22, 2025", amount: "180 ICP", change: "-20 ICP" },
    { month: "Aug 2025", value: 220, date: "Aug 28, 2025", amount: "220 ICP", change: "+40 ICP" },
    { month: "Sept 2025", value: 200, date: "Sept 25, 2025", amount: "200 ICP", change: "-20 ICP" },
    { month: "Oct 2025", value: 190, date: "Oct 30, 2025", amount: "190 ICP", change: "-10 ICP" },
]

const FloatingOrb = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
    <motion.div
        className={`absolute rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 blur-sm ${className}`}
            animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.1, 1],
        }}
        transition={{
            duration: 6,
            repeat: Number.POSITIVE_INFINITY,
            delay,
            ease: "easeInOut",
        }}
    />
)

const Sparkle = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
    <motion.div
        className={`absolute w-1 h-1 bg-blue-300 rounded-full ${className}`}
        animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
        }}
        transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            delay,
        }}
    />
)

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className="bg-slate-800/95 border border-blue-500/50 rounded-lg p-3 shadow-xl backdrop-blur-sm">
                <p className="text-blue-200 text-sm font-medium mb-2">{data.date}</p>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-white text-sm font-semibold">{data.amount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-blue-300 text-sm">{data.change}</span>
                    </div>
                </div>
            </div>
        )
    }
    return null
}

const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
}

// Utility function to trim long addresses
const trimAddress = (address: string, startLength = 6, endLength = 4) => {
    if (!address || address.length <= startLength + endLength + 3) {
        return address;
    }
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

export default function HomeDAO() {
    const { daoId } = useParams<{ daoId: string }>();
    const [showTreasuryTooltip, setShowTreasuryTooltip] = useState(false);
    const [copied, setCopied] = useState(false);
    
    const { dao, loading, error } = useDAO(daoId || '');
    
    // Realistic DAO address (fetched from API later)
    const fullDaoAddress = "0x742d35Cc6634C0532925a3b8f5c62B0F1A38C9Da";
    const displayAddress = trimAddress(fullDaoAddress);
    
    // Fallback data
    const daoTitle = dao?.name || "Community Collective";
    const daoDescription = dao?.description || "A decentralized autonomous organization empowering communities through collaborative decision-making, transparent governance, and shared resource management.";
    
    const handleCopy = async () => {
        try {
            // Copy the full address, not the trimmed version
            await navigator.clipboard.writeText(fullDaoAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };
    
    return (
        <div className="min-h-screen bg-blue-500 pt-[4.5rem]">
            {/* Hero Section */}
            <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-b from-blue-500 via-blue-800 to-blue-950">
                {/* Floating Elements */}
                <FloatingOrb className="w-32 h-32 top-10 left-10" delay={0} />
                <FloatingOrb className="w-24 h-24 top-20 right-20" delay={2} />
                <FloatingOrb className="w-40 h-40 bottom-10 right-10" delay={1} />

                {/* Sparkles */}
                <Sparkle className="top-16 left-1/4" delay={0} />
                <Sparkle className="top-32 right-1/3" delay={1} />
                <Sparkle className="bottom-20 left-1/3" delay={2} />
                <Sparkle className="bottom-32 right-1/4" delay={0.5} />

                <div className="container mx-auto text-center relative z-10">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-blue-300 uppercase tracking-wider mb-6"
                >
                    Welcome to your community
                </motion.p>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-4xl md:text-5xl font-bold text-white mb-6 text-balance"
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <div className="animate-pulse bg-blue-300/30 h-12 w-96 rounded"></div>
                        </div>
                    ) : error ? (
                        <span className="text-blue-200">
                            {daoTitle}
                            <span className="text-xs ml-2 opacity-60">(offline mode)</span>
                        </span>
                    ) : (
                        daoTitle
                    )}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-blue-200 text-lg max-w-3xl mx-auto mb-10 leading-relaxed"
                >
                    {loading ? (
                        <div className="space-y-2">
                            <div className="animate-pulse bg-blue-300/30 h-4 w-full rounded"></div>
                            <div className="animate-pulse bg-blue-300/30 h-4 w-3/4 mx-auto rounded"></div>
                        </div>
                    ) : error ? (
                        <span>
                            {daoDescription}
                            <span className="block text-xs mt-2 opacity-60">
                                * Unable to fetch latest DAO information. Showing cached data.
                            </span>
                        </span>
                    ) : (
                        daoDescription
                    )}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <Link to={`/dao/${daoId}/transaction`}>
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                        Contribute Now
                        </Button>
                    </Link>
                </motion.div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-16 pt-24 px-4 bg-white">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* About Us Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            variants={fadeInUp}
                            whileHover={{ y: -10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <Card className="bg-gradient-to-b from-blue-900 via-blue-900 to-blue-900/85 border-blue-700 backdrop-blur-sm h-full text-white overflow-hidden group">
                                <CardHeader className="bg-blue-700 rounded-t-xl py-4">
                                    <CardTitle className="text-blue-200 text-xl">About us</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-6">
                                    <div className="space-x-4 flex items-center">
                                        <div className="flex items-center justify-center">
                                            <img
                                                src="/src/assets/images/au_1.png"
                                                alt="DAO Address"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-base text-white">
                                                DAO Address
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-blue-200 font-mono">{displayAddress}</span>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-6 w-6 p-0 text-blue-300 hover:text-blue-900 hover:bg-blue-200/20 relative"
                                                    onClick={handleCopy}
                                                >
                                                    <Copy className="w-3 h-3" />
                                                    {copied && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 2, scale: 0.8 }}
                                                            animate={{ opacity: 1, y: -8, scale: 1 }}
                                                            exit={{ opacity: 0, y: -12, scale: 0.8 }}
                                                            className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-0.5 rounded shadow-lg whitespace-nowrap pointer-events-none"
                                                        >
                                                            Copied!
                                                        </motion.div>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-x-4 flex items-center">
                                        <div className="flex items-center justify-center">
                                            <img
                                                src="/src/assets/images/au_2.png"
                                                alt="Launched"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-base text-white">
                                                Launched
                                            </div>
                                            <p className="text-sm text-blue-200">September 14th, 2025</p>
                                        </div>
                                    </div>

                                    <motion.img
                                        src="/src/assets/images/yippie.png"
                                        alt="Yippie Icon"
                                        draggable="false"
                                        className="absolute bottom-0 left-12 w-[16rem] h-auto opacity-70"
                                        initial={{ y: 20, opacity: 0 }}
                                        whileInView={{ y: 0, opacity: 0.85 }}
                                        whileHover={{ opacity: 1, scale: 1.05 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Community Treasury */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            variants={fadeInUp}
                            whileHover={{ y: -10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="lg:col-span-2"
                        >
                            <Card className="bg-blue-700 border-blue-700 text-white">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg text-blue-200 relative">
                                        Community Treasury
                                        <div 
                                            className="relative"
                                            onMouseEnter={() => setShowTreasuryTooltip(true)}
                                            onMouseLeave={() => setShowTreasuryTooltip(false)}
                                        >
                                            <Info className="w-4 h-4 cursor-help hover:text-blue-100 transition-colors" />
                                            {showTreasuryTooltip && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-20"
                                                >
                                                    <div className="bg-slate-800/95 border border-blue-500/50 rounded-lg p-3 shadow-xl backdrop-blur-sm whitespace-nowrap">
                                                        <p className="text-white text-sm font-medium mb-1">Community Treasury</p>
                                                        <p className="text-blue-200 text-xs leading-relaxed max-w-64">
                                                            Funds managed collectively by the DAO members.<br />
                                                            Used for project funding and community initiatives.
                                                        </p>
                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                                                            <div className="border-4 border-transparent border-t-slate-800/95"></div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </CardTitle>
                                    <div className="text-3xl font-bold">200 ICP</div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-64 w-full bg-blue-900 rounded-lg p-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                                <defs>
                                                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                        <stop offset="0%" stopColor="#bfdbfe" /> {/* blue-200 */}
                                                        <stop offset="50%" stopColor="#fbbf24" /> {/* yellow-400 */}
                                                        <stop offset="100%" stopColor="#60a5fa" /> {/* blue-400 */}
                                                    </linearGradient>
                                                </defs>
                                                <XAxis
                                                    dataKey="month"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: "#93c5fd", fontSize: 12 }}
                                                    interval={0}
                                                />
                                                <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
                                                <Tooltip
                                                    content={<CustomTooltip />}
                                                    cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "3 3" }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="url(#lineGradient)"
                                                    strokeWidth={3}
                                                    dot={{
                                                        fill: "#fbbf24",
                                                        strokeWidth: 2,
                                                        r: 5,
                                                        stroke: "#1e40af",
                                                    }}
                                                    activeDot={{
                                                        r: 8,
                                                        fill: "#fbbf24",
                                                        stroke: "#1e40af",
                                                        strokeWidth: 3,
                                                        style: { filter: "drop-shadow(0 0 8px #fbbf24)" },
                                                    }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Empty State Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        variants={fadeInUp}
                        whileHover={{ y: -10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="mt-12"
                    >
                        <Card className="border-dashed border-2 border-blue-300/30 bg-transparent relative">
                            <CardContent className="py-16 text-center">
                                <div className="mb-6 relative">
                                    <motion.img
                                        src="/src/assets/images/ghost.png"
                                        alt="Empty state mascot"
                                        draggable="false"
                                        className="w-32 h-32 mx-auto relative z-10"
                                        initial={{ 
                                            x: -500, 
                                            y: 100,
                                            opacity: 0.6,
                                            scale: 0.7
                                        }}
                                        whileInView={{
                                            x: [-500, 500, 0],
                                            y: [100, 100, -30, 0],
                                            opacity: [0.6, 0.8, 1, 1],
                                            scale: [0.7, 0.8, 1.1, 1],
                                            rotate: [0, 5, -10, 0]
                                        }}
                                        transition={{
                                            duration: 3,
                                            times: [0, 0.4, 0.7, 1],
                                            ease: ["easeOut", "linear", "easeInOut"],
                                            delay: 0.3
                                        }}
                                        viewport={{ once: true, margin: "-50px" }}
                                    />
                                </div>
                                
                                <motion.h3 
                                    className="text-2xl font-bold mb-1 leading-tight"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.8, duration: 0.6 }}
                                    viewport={{ once: true }}
                                >
                                    Seems a bit empty here...
                                </motion.h3>
                                
                                <motion.p 
                                    className="text-muted-foreground mb-6"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 2.0, duration: 0.6 }}
                                    viewport={{ once: true }}
                                >
                                    Start exploring plugins to unlock new features for your DAO.
                                </motion.p>
                                
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 2.2, duration: 0.6 }}
                                    viewport={{ once: true }}
                                >
                                    <Link to={`/dao/${daoId}/plugins`}>
                                        <Button className="bg-blue-600 hover:bg-blue-700">Discover More Plugins</Button>
                                    </Link>
                                </motion.div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>
        </div>
    )
}
