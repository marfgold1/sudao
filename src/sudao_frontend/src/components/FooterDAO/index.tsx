import React from 'react';

import Logo from '@/assets/logos/SUDAOWhite.png';
import { Link, useParams } from 'react-router-dom';
import { useDAO } from '@/hooks/useDAO';

const FooterDAO: React.FC = () => {
    const { daoId } = useParams<{ daoId: string }>();
    
    // Fetch DAO data with fallback handling
    const { dao, loading, error } = useDAO(daoId || '');
    
    // Fallback values if data fetch fails or is loading
    const daoName = dao?.name || 'My DAO';
    const daoDescription = dao?.description || 'A community-driven organization built with SUDAO platform.';

    const handleLinkClick = () => {
        // Smooth scroll to top when navigating
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <footer className="bg-blue-950 text-white py-16 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left Section - Brand and Description */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-4">
                                {loading ? (
                                    <span className="animate-pulse bg-gray-600 rounded h-6 w-32 inline-block"></span>
                                ) : error ? (
                                    <span className="text-red-400">Failed to load DAO</span>
                                ) : (
                                    daoName
                                )}
                            </h3>
                            <p className="text-gray-300 leading-relaxed max-w-md">
                                {loading ? (
                                    <>
                                        <span className="animate-pulse bg-gray-600 rounded h-4 w-full inline-block mb-2"></span>
                                        <span className="animate-pulse bg-gray-600 rounded h-4 w-3/4 inline-block"></span>
                                    </>
                                ) : error ? (
                                    'Unable to load DAO information at this time.'
                                ) : (
                                    daoDescription
                                )}
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
                            <Link to={`/dao/${daoId}/home`} onClick={handleLinkClick} className="block text-gray-300 hover:text-white transition-colors duration-200">
                                Homepage
                            </Link>
                            <Link to={`/dao/${daoId}/home`} onClick={handleLinkClick} className="block text-gray-300 hover:text-white transition-colors duration-200">
                                Contributions
                            </Link>
                            <Link to={`/dao/${daoId}/proposal`} onClick={handleLinkClick} className="block text-gray-300 hover:text-white transition-colors duration-200">
                                Proposals
                            </Link>
                            <Link to={`/dao/${daoId}/plugins`} onClick={handleLinkClick} className="block text-gray-300 hover:text-white transition-colors duration-200">
                                Plugins
                            </Link>
                        </nav>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default FooterDAO;