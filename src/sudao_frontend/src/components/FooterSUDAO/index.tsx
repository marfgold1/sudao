import React from 'react';

import Logo from '@/assets/logos/SUDAOWhite.png';
import { Link } from 'react-router-dom';

const FooterSUDAO: React.FC = () => {
    return (
        <footer className="bg-blue-950 text-white py-16 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left Section - Brand and Description */}
                    <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10">
                                <img src={Logo} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-4">SUDAO by SUDO INIT</h3>
                            <p className="text-gray-300 leading-relaxed max-w-md">
                                SUDAO will be an all-in-one platform to launch DAOs, with a no-code approach with plugins so everything
                                will be just plug-and-play.
                            </p>
                        </div>
                    </div>

                    {/* Right Section - Sitemap */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Sitemap</h3>
                        <nav className="space-y-3">
                            <Link to="/" className="block text-gray-300 hover:text-white transition-colors duration-200">
                                Home
                            </Link>
                            <Link to="/discover" className="block text-gray-300 hover:text-white transition-colors duration-200">
                                Discover Collective
                            </Link>
                            <Link to="/plugin" className="block text-gray-300 hover:text-white transition-colors duration-200">
                                Plugin Marketplace
                            </Link>
                            <Link to="#" className="block text-gray-300 hover:text-white transition-colors duration-200">
                                Documentation
                            </Link>
                        </nav>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default FooterSUDAO;