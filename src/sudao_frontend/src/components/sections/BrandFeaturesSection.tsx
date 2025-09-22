import { motion } from "framer-motion";
import b_1 from "@/assets/images/b_1.png";
import b_2 from "@/assets/images/b_2.png";
import b_3 from "@/assets/images/b_3.png";

export function BrandFeaturesSection() {
    const fadeInUp = {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 },
    };

    return (
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
                    viewport={{ once: true }}
                    className="grid md:grid-cols-3 gap-8"
                >
                    <motion.div
                        variants={fadeInUp}
                        whileHover={{ y: -10 }}
                        className="bg-gradient-to-b from-blue-900 via-blue-900 to-blue-900/85 text-white backdrop-blur-sm border border-slate-400 rounded-2xl p-8 pt-12 text-center transition-all duration-300"
                    >
                        <div className="w-full mx-auto mb-[-1rem] flex items-center justify-center">
                            <img
                                src={b_1}
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
                                src={b_2}
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
                                src={b_3}
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
    );
}

export default BrandFeaturesSection;