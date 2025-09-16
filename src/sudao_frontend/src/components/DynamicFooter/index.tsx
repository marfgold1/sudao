import React from 'react';
import { useLocation } from 'react-router-dom';
import FooterSUDAO from '../FooterSUDAO';
import FooterDAO from '../FooterDAO';

const DynamicFooter: React.FC = () => {
    const location = useLocation();
    
    // Check if current route is for a specific DAO
    const isDaoRoute = location.pathname.includes('/home/') || 
                      location.pathname.includes('/proposal/') ||
                      location.pathname.includes('/profile') ||
                      location.pathname.includes('/404');
    
    return isDaoRoute ? <FooterDAO /> : <FooterSUDAO />;
};

export default DynamicFooter;