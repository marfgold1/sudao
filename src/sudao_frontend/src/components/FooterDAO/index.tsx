import React from 'react';

import Logo from '@/assets/logos/SUDAOWhite.png';

const FooterDAO: React.FC = () => {
    return (
        <footer className="bg-blue-950 text-white py-16 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left Section - Brand and Description */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-4">[DAO Name]</h3>
                            <p className="text-gray-300 leading-relaxed max-w-md">
                                [DAO Desc]
                            </p>
                        </div>

                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10">
                                <img src={Logo} />
                            </div>
                            <div>Built with <span className="font-semibold">SUDAO</span></div>
                        </div>
                    </div>

                    {/* Right Section - Sitemap */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Sitemap</h3>
                        <nav className="space-y-3">
                            <a href="#" className="block text-gray-300 hover:text-white transition-colors duration-200">
                                Homepage
                            </a>
                            <a href="#" className="block text-gray-300 hover:text-white transition-colors duration-200">
                                Contributions
                            </a>
                            <a href="#" className="block text-gray-300 hover:text-white transition-colors duration-200">
                                Proposals
                            </a>
                            <a href="#" className="block text-gray-300 hover:text-white transition-colors duration-200">
                                Plugins
                            </a>
                        </nav>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default FooterDAO;