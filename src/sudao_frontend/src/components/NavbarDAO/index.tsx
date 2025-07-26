import { motion } from 'framer-motion';
import {  Menu, Settings } from 'lucide-react';
import React, { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback } from '../ui/avatar';

const NavbarDAO: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { daoId } = useParams<{ daoId: string }>();
    const location = useLocation();
    
    const isActive = (path: string) => location.pathname.includes(path);
    
    return (
        <>
            {/* Navigation */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-slate-900 text-white backdrop-blur-sm"
            >
                <div className="px-6 mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-10">
                        <div className="hidden md:flex items-center space-x-10">
                            <a 
                                href={`/home/${daoId}`} 
                                className={`transition-colors ${
                                    isActive('/home/') ? 'text-blue-200 font-semibold' : 'text-white hover:text-blue-200'
                                }`}
                            >
                                Home
                            </a>
                            <a 
                                href={`/proposal/${daoId}`} 
                                className={`transition-colors ${
                                    isActive('/proposal/') ? 'text-blue-200 font-semibold' : 'text-white hover:text-blue-200'
                                }`}
                            >
                                Proposals
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <motion.button
                            className="flex items-center space-x-2 text-white/80 bg-blue-600/30 rounded-lg p-2 px-4 hover:text-blue-300 transition-colors"
                            whileHover={{ scale: 1.05 }}
                        >
                            <Settings className="w-4 h-4" />
                            <span>Creator Dashboard</span>
                        </motion.button>
                        <Avatar>
                            <AvatarFallback className="bg-white/60 text-black">CN</AvatarFallback>
                        </Avatar>
                        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden mt-4 pb-4 border-t border-slate-700"
                    >
                        <div className="flex flex-col space-y-3 pt-4">
                            <a 
                                href={`/home/${daoId}`} 
                                className={`transition-colors font-semibold ${
                                    isActive('/home/') ? 'text-blue-200 font-semibold' : 'text-white hover:text-blue-200'
                                }`}
                            >
                                Home
                            </a>
                            <a 
                                href={`/proposal/${daoId}`} 
                                className={`transition-colors ${
                                    isActive('/proposal/') ? 'text-blue-200 font-semibold' : 'text-white hover:text-blue-200'
                                }`}
                            >
                                Proposals
                            </a>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </>
    )
};

export default NavbarDAO;