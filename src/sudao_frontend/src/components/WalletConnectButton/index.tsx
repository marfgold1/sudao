import { ConnectWallet, ConnectWalletButtonProps } from "@nfid/identitykit/react";
import { motion } from "framer-motion";
import Logo from '@/assets/logos/SUDAOWhite.png';

// --- TYPE DEFINITION FOR CLEANUP ---
// Omit conflicting props from the library's component type
type OmittedProps = 
    | 'type' 
    | 'onDrag' 
    | 'onDragStart' 
    | 'onDragEnd'
    | 'onAnimationStart' 
    | 'onAnimationEnd' 
    | 'onAnimationIteration';

type SafeConnectButtonProps = Omit<ConnectWalletButtonProps, OmittedProps>;

// --- CUSTOM STYLED BUTTON (Passed to ConnectWallet) ---
const CustomConnectButton = ({ 
    loading, 
    children, 
    ...rest 
}: SafeConnectButtonProps) => {

    const isButtonDisabled = loading || rest.disabled;
    const isHoverable = !isButtonDisabled;

    const baseClasses = [
        'relative flex items-center justify-center',
        'px-6 py-1.5 bg-gradient-to-r from-blue-600 to-blue-800',
        'text-white font-bold rounded-full shadow-xl overflow-hidden z-10 whitespace-nowrap',
        'hover:from-blue-700 hover:to-blue-900',
        'transform transition-all duration-300 ease-in-out',
        'group sudao-signin-button', 
    ];
    
    if (loading) {
        baseClasses.push('opacity-70 cursor-not-allowed');
    }

    const buttonText = loading ? 'Connecting...' : 'Sign In';

    return (
        <motion.button
            {...rest}
            type="button" 
            disabled={isButtonDisabled} 
            className={baseClasses.join(' ')}
            
            // Framer Motion pop-up effect
            whileHover={{ 
                scale: isHoverable ? 1.05 : 1,
                boxShadow: isHoverable ? "0 8px 15px rgba(0, 0, 0, 0.4)" : 'none',
            }}
            whileTap={{ scale: isHoverable ? 0.95 : 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
            {/* Glare Effect Span (Requires global CSS definition) */}
            <span className="glare-effect absolute inset-0 z-20 pointer-events-none"></span>
            
            {/* Logo and Text Content */}
            <div className='flex items-center z-30'>
                <img
                    src={Logo}
                    className="w-8 h-8 mr-2"
                    alt="SUDAO Logo"
                />
                <span className='font-semibold'>
                    {buttonText}
                </span>
            </div>
        </motion.button>
    );
};

// --- WRAPPER COMPONENT FOR EXPORT ---
// This component wraps ConnectWallet and provides the custom button component, 
// allowing the final export to be WalletConnectButton.
const WalletConnectButton = (props: any) => (
    <ConnectWallet 
        {...props}
        connectButtonComponent={CustomConnectButton}
    />
);

export default WalletConnectButton;