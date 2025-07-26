import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CollectiveCard } from "@/components"
import { discoverCollectives, floatingCards, userCollectives } from "@/mocks"


const DiscoverCollectives: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("")
    const [filteredCollectives, setFilteredCollectives] = useState(discoverCollectives)

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        if (!query.trim()) {
            setFilteredCollectives(discoverCollectives)
            return
        }

        const filtered = discoverCollectives.filter(
        (collective) =>
            collective.name.toLowerCase().includes(query.toLowerCase()) ||
            collective.description.toLowerCase().includes(query.toLowerCase()) ||
            collective.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
        )
        setFilteredCollectives(filtered)
    }

    return (
        <div className="min-h-screen bg-background">
            <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20 overflow-hidden">
                <div className="container mx-auto px-8 relative z-10 pt-[4.5rem]">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
                        >
                            READY TO LAUNCH
                            <br />
                            YOUR MOVEMENT WITH DAO?
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-xl md:text-2xl mb-8 text-blue-100 max-w-2xl mx-auto"
                        >
                            Create a transparent, community-powered organization today—with no code, no setup hassles.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                        >
                            <Button
                                size="lg"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                            <Plus className="mr-2 h-5 w-5" />
                            Start a new Collective
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Floating Cards Animation */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {floatingCards.map((card) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 100, x: card.x }}
                            animate={{
                                opacity: [0, 0.6, 0.8, 0.6],
                                y: [100, card.y - 20, card.y, card.y + 10],
                                x: card.x,
                                rotate: [0, 2, -1, 1],
                            }}
                            transition={{
                                duration: 4,
                                delay: card.delay,
                                repeat: Number.POSITIVE_INFINITY,
                                repeatType: "reverse",
                                ease: "easeInOut",
                            }}
                            className="absolute w-16 h-10 bg-blue-400/30 rounded-lg backdrop-blur-sm border border-blue-300/20"
                            style={{ left: `${(card.x / 800) * 100}%` }}
                        />
                    ))}
                </div>

                {/* Background Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
            </section>

            {/* Search Section */}
            <section className="py-12 pb-16 px-10 bg-background">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mx-auto mb-12"
                    >
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Search by name, tag, or description..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10 h-12 text-base"
                            />
                            <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8">Search</Button>
                        </div>
                    </motion.div>

                    {/* Collective Managed by You */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mb-12"
                    >
                        <h2 className="text-2xl font-bold mb-6">Collective Managed by You</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {userCollectives.map((collective, index) => (
                                <CollectiveCard key={collective.id} collective={collective} index={index} isOwned={true} />
                            ))}
                        </div>
                    </motion.div>

                    {/* Discover Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <h2 className="text-2xl font-bold mb-6">Discover</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredCollectives.map((collective, index) => (
                                <CollectiveCard key={collective.id} collective={collective} index={index} isOwned={false} />
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    )
}

export default DiscoverCollectives;