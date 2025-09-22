import type React from "react"

import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import four_0_four from "@/assets/images/404.png";

const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Main Content */}
            <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left side - Illustration */}
                    <div className="flex justify-center lg:justify-end">
                        <motion.div
                            className="relative w-[30rem] h-[30rem]"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <img src={four_0_four} alt="404 Chars" className="w-full h-full object-contain" />
                        </motion.div>
                    </div>

                    {/* Right side - Content */}
                    <div className="text-center lg:text-left space-y-4">
                        <motion.h1
                            className="text-3xl font-bold text-gray-900"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            Oops! It seems like you got lost
                        </motion.h1>

                        <motion.p
                            className="text-lg text-gray-600 leading-relaxed mb-8"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                        >
                            The page you're looking for doesn't exist
                            <br />
                            or has been moved.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                        >
                            <Link to="/">
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 mt-4 px-20 text-lg rounded-lg"
                                    size="lg"
                                >
                                    Back to Homepage
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default NotFound
