import { motion } from "framer-motion";
import windowSrc from "@/assets/images/window.png";

export function CTASection() {
    return (
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
                        src={windowSrc}
                        alt="Window"
                        className="absolute center bottom-0 w-[90rem] h-auto"
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    />
                </div>
            </div>
        </section>
    );
}

export default CTASection;