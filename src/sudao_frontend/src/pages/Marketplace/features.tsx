import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

const features = [
    {
        title: "Discover Plugins",
        description:
        "From the SUDAO’s Community, plugin can be made by anyone! As simple as uploading your own code through us.",
        icon: "/src/assets/images/pf_1.png",
    },
    {
        title: "Install to your DAO",
        description: "Securely purchase plugins with ICP tokens",
        icon: "/src/assets/images/pf_2.png",
    },
    {
        title: "Use & Earn",
        description: "DAOs get instant functionality. Developers earn recurring revenue each time their plugin is used.",
        icon: "/src/assets/images/pf_3.png",
    },
    {
        title: "Evolve Together",
        description: "Community-driven ratings and updates ensure the best tools rise to the top.",
        icon: "/src/assets/images/pf_4.png",
    },
]

const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
}

export function FeaturesSection() {
    return (
        <section className="bg-blue-950 py-20">
            <div className="container mx-auto px-4 max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simply Install SUDAO’s Plugin</h2>
                    <p className="text-blue-300 max-w-4xl text-lg leading-relaxed">
                        Plugins are modular add-ons that extend the functionality of your DAO. Think of them as ready-made tools:
                        governance voting systems, treasury dashboards, analytics, or even gamified community perks.
                    </p>
                </motion.div>

                <motion.div
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }} 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            variants={fadeInUp}
                            whileHover={{ y: -10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                            <Card className="bg-gradient-to-b from-blue-900 via-blue-900 to-blue-900/85 border-blue-700 backdrop-blur-sm h-full">
                                <CardContent className="p-6">
                                    <div className="w-full">
                                        <h3 className="text-2xl text-white mb-3">{feature.title}</h3>
                                        <p className="text-blue-200 text-sm leading-relaxed mb-4">{feature.description}</p>
                                        
                                        <motion.img
                                            initial={{ y: 20, opacity: 0 }}
                                            whileInView={{ y: 0, opacity: 0.85 }}
                                            whileHover={{ y: -5, opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                            src={feature.icon}
                                            alt="Feature Icon"
                                            draggable="false"
                                            className="filter drop-shadow-lg mx-auto block"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
