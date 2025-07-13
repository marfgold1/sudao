import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import React, { useState } from 'react';

const Navbar: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    
    return (
        <>
            {/* Navigation */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-blue-700/80 backdrop-blur-sm"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-10">
                        <div className="w-6 h-6 border-2 border-blue-200 rotate-45"></div>
                        <div className="hidden md:flex items-center space-x-8 text-sm">
                            <a href="#" className="text-white hover:text-blue-200 transition-colors font-semibold">
                                Home
                            </a>
                            <a href="#" className="text-white hover:text-blue-200 transition-colors">
                                Discover Collectives
                            </a>
                            <a href="#" className="text-white hover:text-blue-200 transition-colors">
                                How it Works
                            </a>
                            <a href="#" className="text-white hover:text-blue-200 transition-colors">
                                About Us
                            </a>
                            <a href="#" className="text-white hover:text-blue-200 transition-colors">
                                Meet Us
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-bold text-slate-900">
                            57
                        </div>
                        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    )
};

export default Navbar;