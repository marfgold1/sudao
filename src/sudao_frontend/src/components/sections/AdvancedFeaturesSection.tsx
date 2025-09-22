import { motion } from "framer-motion";
import c1_1 from "@/assets/images/c1_1.png";
import c1_2 from "@/assets/images/c1_2.png";
import c2_1 from "@/assets/images/c2_1.png";
import c2_2 from "@/assets/images/c2_2.png";
import c3 from "@/assets/images/c3.png";
import c4_1 from "@/assets/images/c4_1.png";
import c4_2 from "@/assets/images/c4_2.png";

export function AdvancedFeaturesSection() {
    return (
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
                                src={c1_2}
                                alt="Chat interface"
                                className="absolute bottom-8 left-12 w-[16rem] h-auto opacity-70"
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 0.8 }}
                                whileHover={{ y: -5, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            />

                            {/* Right decorative image */}
                            <motion.img
                                src={c1_1}
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
                                src={c2_1}
                                alt="Chat interface"
                                className="absolute bottom-4 left-8 w-[22rem] h-auto opacity-70"
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 0.8 }}
                                whileHover={{ y: -5, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            />

                            {/* Right decorative image */}
                            <motion.img
                                src={c2_2}
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
                            <h1 className="font-bold text-xl pb-1 z-20 relative">CREATOR DASHBOARD</h1>
                            <h3 className="z-20 relative">Customize your DAO management anywhere.</h3>

                            {/* Blurry circle decoration */}
                            <div className="absolute -bottom-20 center w-80 h-80 bg-gradient-to-br from-blue-800 to-blue-700 rounded-full blur-xl opacity-70"></div>
                            <div className="absolute -top-12 right-12 w-40 h-40 bg-gradient-to-br from-blue-800 to-blue-700 rounded-full blur-xl opacity-40"></div>

                            {/* Left decorative image */}
                            <motion.img
                                src={c3}
                                alt="Chat interface"
                                className="absolute bottom-[-2rem] center w-[22rem] h-auto opacity-70"
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
                                src={c4_1}
                                alt="Chat interface"
                                className="absolute bottom-4 left-12 w-[18rem] h-auto opacity-70"
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 0.8 }}
                                whileHover={{ y: -5, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            />

                            {/* Right decorative image */}
                            <motion.img
                                src={c4_2}
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
    );
}

export default AdvancedFeaturesSection;