import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import p_1 from "@/assets/images/p_1.png";
import p_2 from "@/assets/images/p_2.png";
import p_3 from "@/assets/images/p_3.png";
import p_4 from "@/assets/images/p_4.png";

export function HeroSection() {
    const scrollToMarketplace = () => {
        const marketplaceSection = document.getElementById('marketplace-section');
        if (marketplaceSection) {
            marketplaceSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    return (
        <section className="bg-blue-900 relative overflow-hidden min-h-screen pt-[4.5rem] flex items-center">
            <div className="absolute inset-0">
                {/* Firefly 1 */}
                <motion.div
                    animate={{
                        opacity: [0.3, 0.8, 0.3],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                    className="absolute -bottom-20 -right-20 w-[25rem] h-[25rem] bg-blue-400/40 rounded-full blur-xl backdrop-blur-sm"
                />

                {/* Firefly 2 */}
                <motion.div
                    animate={{
                        opacity: [0.2, 0.7, 0.2],
                        scale: [1, 1.3, 1],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: 1,
                    }}
                    className="absolute -top-20 -left-20 w-[30rem] h-[30rem] bg-blue-300/50 rounded-full blur-lg backdrop-blur-sm"
                />

                {/* Firefly 3 */}
                <motion.div
                    animate={{
                        opacity: [0.4, 0.9, 0.4],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: 2,
                    }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-blue-400/30 rounded-full blur-md backdrop-blur-sm"
                />

                {/* Firefly 4 */}
                <motion.div
                    animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.4, 1],
                    }}
                    transition={{
                        duration: 3.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: 0.5,
                    }}
                    className="absolute top-1/4 right-1/4 w-28 h-28 bg-blue-300/35 rounded-full blur-lg backdrop-blur-sm"
                />

                {/* Additional smaller fireflies */}
                <motion.div
                    animate={{
                        opacity: [0.2, 0.5, 0.2],
                        x: [0, 20, 0],
                        y: [0, -15, 0],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                    }}
                    className="absolute top-1/6 left-2/3 w-16 h-16 bg-blue-400/25 rounded-full blur-sm backdrop-blur-sm"
                />
            </div>

            <div className="container mx-auto px-4 py-24 relative z-10">
                <div className="text-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex justify-center mb-12"
                    >
                        <div className="relative w-32 h-32">
                            {/* Bottom Left Piece - comes from bottom left */}
                            <motion.img
                                initial={{ x: -100, y: 100, opacity: 0 }}
                                animate={{ x: 0, y: 0, opacity: 1 }}
                                transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                                src={p_2}
                                alt="Puzzle piece"
                                draggable="false"
                                className="absolute bottom-[-2rem] left-[-2rem] filter drop-shadow-lg"
                            />

                            {/* Bottom Right Piece - comes from bottom right */}
                            <motion.img
                                initial={{ x: 100, y: 100, opacity: 0 }}
                                animate={{ x: 0, y: 0, opacity: 1 }}
                                transition={{ duration: 1.2, delay: 0.7, ease: "easeOut" }}
                                src={p_3}
                                alt="Puzzle piece"
                                draggable="false"
                                className="absolute bottom-[-3rem] right-[-2rem] h-32 filter drop-shadow-lg"
                            />

                            {/* Top Left Piece - comes from top left */}
                            <motion.img
                                initial={{ x: -100, y: -100, opacity: 0 }}
                                animate={{ x: 0, y: 0, opacity: 1 }}
                                transition={{ duration: 1.2, delay: 0.9, ease: "easeOut" }}
                                src={p_1}
                                alt="Puzzle piece"
                                draggable="false"
                                className="absolute top-[-1rem] left-[-2rem] filter drop-shadow-lg"
                            />

                            {/* Top Right Piece - hanging and animated */}
                            <motion.img
                                initial={{ x: 100, y: -150, opacity: 0 }}
                                animate={{
                                    x: 0,
                                    y: [-20, -15, -20],
                                    opacity: 1,
                                    rotate: [0, 2, -2, 0],
                                }}
                                transition={{
                                    x: { duration: 1.2, delay: 1.1, ease: "easeOut" },
                                    opacity: { duration: 0.5, delay: 1.1 },
                                    y: {
                                        duration: 2,
                                        repeat: Number.POSITIVE_INFINITY,
                                        ease: "easeInOut",
                                        delay: 2.3,
                                    },
                                    rotate: {
                                        duration: 3,
                                        repeat: Number.POSITIVE_INFINITY,
                                        ease: "easeInOut",
                                        delay: 2.3,
                                    },
                                }}
                                src={p_4}
                                alt="Puzzle piece"
                                draggable="false"
                                className="absolute top-[-2rem] right-[-4.5rem] filter drop-shadow-lg"
                            />
                        </div>
                    </motion.div>

                    {/* Hero Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.5 }}
                        className="mb-12"
                    >
                        <h1 className="tracking-tight text-4xl md:text-5xl font-light text-white text-balance">
                            Combine the <span className="font-semibold">Pieces</span>
                        </h1>
                        <h1 className="tracking-tight text-4xl md:text-5xl font-light text-white mb-4 text-balance">
                            Establish your Community
                        </h1>
                    </motion.div>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 1.7 }}
                    >
                        <Button
                            size="lg"
                            className="bg-transparent hover:bg-white text-white hover:text-blue-900 border-2 border-white/80 px-8 py-5 text-lg backdrop-blur-sm"
                            onClick={scrollToMarketplace}
                        >
                            Discover Available Plugins
                        </Button>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
