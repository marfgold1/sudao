import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import React, { useState } from 'react';
import { ConnectWallet } from "@nfid/identitykit/react";
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { useLocation } from 'react-router-dom';
import Logo from '@/assets/logos/SUDAOWhite.png';

const NavbarSUDAO: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const location = useLocation();
    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.includes(path);
    };
    
    return (
        <>
            {/* Navigation */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="fixed top-0 left-0 right-0 z-40 px-6 py-4 bg-blue-700/80 backdrop-blur-sm"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-10">
                        <div className="w-10 h-10">
                            <img src={Logo} />
                        </div>
                        <div className="hidden md:flex items-center space-x-10">
                            <a  
                                href="/" 
                                className={`transition-colors ${
                                    isActive('/') ? 'text-blue-200 font-semibold' : 'text-white hover:text-blue-200'
                                }`}
                            >
                                Home
                            </a>
                            <a  
                                href="/discover" 
                                className={`transition-colors ${
                                    isActive('/discover') ? 'text-blue-200 font-semibold' : 'text-white hover:text-blue-200'
                                }`}
                            >
                                Discover Collectives
                            </a>
                            {/* <a href="#" className="text-white hover:text-blue-200 transition-colors">
                                How it Works
                            </a>
                            <a href="#" className="text-white hover:text-blue-200 transition-colors">
                                About Us
                            </a>
                            <a href="#" className="text-white hover:text-blue-200 transition-colors">
                                Meet Us
                            </a> */}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <ConnectWallet />
                        <button className="p-2 px-4 bg-gradient-to-r from-blue-100 to-blue-50 hover:bg-blue-300 rounded-xl flex items-center justify-center">
                            <GitHubLogoIcon className="w-6 h-6" />
                        </button>
                        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </>
    )
};

export default NavbarSUDAO;