import { motion } from 'framer-motion';
import {  Menu, Settings } from 'lucide-react';
import React, { useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ConnectWallet } from "@nfid/identitykit/react";
import { Avatar, AvatarFallback } from '../ui/avatar';
import ExpandableLogo from '../ExpandableLogo';

const NavbarDAO: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { daoId } = useParams<{ daoId: string }>();
    const location = useLocation();
    
    const isActive = (path: string) => location.pathname.endsWith(path);
    
    return (
        <>
            {/* Navigation */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="fixed top-0 left-0 right-0 z-40 px-6 py-4 bg-slate-900 text-white backdrop-blur-sm"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-10">
                        <ExpandableLogo />
                        <div className="hidden md:flex items-center space-x-10">
                            <Link 
                                to={`/dao/${daoId}/home`} 
                                className={`transition-colors ${
                                    isActive('/home') ? 'text-white font-semibold' : 'text-slate-400 hover:text-blue-200'
                                }`}
                            >
                                [DAO Name]
                            </Link>
                            <Link 
                                to={`/dao/${daoId}/proposal`} 
                                className={`transition-colors ${
                                    isActive('/proposal') ? 'text-white font-semibold' : 'text-slate-400 hover:text-blue-200'
                                }`}
                            >
                                Proposals
                            </Link>
                            <Link 
                                to={`/dao/${daoId}/plugins`} 
                                className={`transition-colors ${
                                    isActive('/plugins') ? 'text-white font-semibold' : 'text-slate-400 hover:text-blue-200'
                                }`}
                            >
                                Plugins
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <ConnectWallet />
                        <Link to={`/dao/${daoId}/creator-dashboard`}>
                            <motion.button
                                className="flex items-center space-x-2 text-white/80 bg-blue-600/30 rounded-lg p-2 px-4 hover:text-blue-300 transition-colors"
                                whileHover={{ scale: 1.05 }}
                            >
                                <Settings className="w-4 h-4" />
                                <span>Creator Dashboard</span>
                            </motion.button>
                        </Link>
                        <Link to={`/dao/${daoId}/profile`}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                            >
                                <Avatar>
                                    <AvatarFallback className="bg-white/60 text-black">CN</AvatarFallback>
                                </Avatar>
                            </motion.button>
                        </Link>
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
                            <Link 
                                to={`/home/${daoId}`} 
                                className={`transition-colors font-semibold ${
                                    isActive('/home/') ? 'text-blue-200 font-semibold' : 'text-white hover:text-blue-200'
                                }`}
                            >
                                Home
                            </Link>
                            <Link 
                                to={`/proposal/${daoId}`} 
                                className={`transition-colors ${
                                    isActive('/proposal/') ? 'text-blue-200 font-semibold' : 'text-white hover:text-blue-200'
                                }`}
                            >
                                Proposals
                            </Link>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </>
    )
};

export default NavbarDAO;