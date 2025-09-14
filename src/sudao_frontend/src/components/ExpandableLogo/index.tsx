import { useState } from "react"
import Logo from '@/assets/logos/SUDAOWhite.png';
import { Link } from "react-router-dom";

export default function ExpandableLogo() {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <Link
            to="/"
            className="relative inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`
                    relative overflow-hidden
                    bg-gradient-to-r from-blue-500 to-[#71AAC6] border border-blue-400
                    flex items-center justify-center
                    transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${isHovered ? "w-32 h-10 rounded-full px-12" : "w-10 h-10 rounded-full"}
                `}
            >
                {/* Star Icon */}
                <div
                    className={`
                        flex-shrink-0 
                        transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                        ${isHovered ? "mr-1 scale-95 rotate-360" : "scale-100 rotate-0"}
                    `}
                >
                    <img src={Logo} alt="SUDAO" className="w-10 h-10 object-contain" />
                </div>

                {/* SUDAO Text */}
                <div
                    className={`
                        text-white font-semibold text-sm whitespace-nowrap
                        transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]
                        ${isHovered ? "opacity-100 translate-x-0 delay-100" : "opacity-0 translate-x-1 w-0 delay-0"}
                    `}
                >
                    SUDAO
                </div>
            </div>
        </Link>
    )
}
