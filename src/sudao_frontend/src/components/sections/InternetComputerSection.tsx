import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function InternetComputerSection() {
    return (
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

                    <a href="https://internetcomputer.org" target="_blank">
                        <Button 
                            className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-lg">
                            Learn More About ICP
                        </Button>
                    </a>
                </motion.div>
            </div>
        </section>
    );
}

export default InternetComputerSection;