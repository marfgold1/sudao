import { motion } from "framer-motion";
import { Menu, Settings, ChevronDown, Sliders } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { ConnectWallet } from "@nfid/identitykit/react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import ExpandableLogo from "../ExpandableLogo";
import { useDAO } from "@/hooks/useDAO";
import { usePluginStore, Plugin } from "@/lib/plugin-store";
import PluginCustomizationModal from "../PluginCustomizationModal";

// Utility function to truncate text (plugins, DAO names, etc.)
const truncateText = (text: string, maxLength: number = 12) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

// Convenience functions for specific use cases
const truncatePluginName = (name: string, maxLength: number = 12) =>
  truncateText(name, maxLength);
const truncateDAOName = (name: string) => truncateText(name, 12); // Same as plugins for laptop compatibility

const NavbarDAO: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pluginDropdownOpen, setPluginDropdownOpen] = useState(false);
  const [customizationModalOpen, setCustomizationModalOpen] = useState(false);
  const [visiblePluginCount, setVisiblePluginCount] = useState(2);
  const { daoId } = useParams<{ daoId: string }>();
  const location = useLocation();

  // Fetch DAO data with fallback handling
  const { daoInfo, isLoading } = useDAO();

  // Get installed plugins using the new store method with proper reactivity
  const { getOrderedNavPlugins, navbarPreferences } = usePluginStore();
  const plugins = usePluginStore((state) => state.plugins); // Subscribe to plugins for reactivity
  const navPlugins = useMemo(
    () => getOrderedNavPlugins(),
    [getOrderedNavPlugins, plugins]
  );

  // Dynamic space detection for responsive plugin visibility
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 1300) {
        setVisiblePluginCount(0); // Hide all plugins on smaller screens
      } else if (width < 1500) {
        setVisiblePluginCount(1); // Show 1 plugin on medium screens
      } else {
        setVisiblePluginCount(2); // Show 2 plugins on larger screens
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Split plugins for navigation with dynamic space management
  const { visiblePlugins, dropdownPlugins } = useMemo(() => {
    if (navbarPreferences.visiblePluginIds.length > 0) {
      // Get preferred visible plugins (that still exist and are active)
      const preferredVisible = navbarPreferences.visiblePluginIds
        .map((id) => navPlugins.find((p) => p.id === id))
        .filter(Boolean) as Plugin[];

      // Get remaining plugins for dropdown
      const preferredVisibleIds = preferredVisible.map((p) => p.id);
      const remaining = navPlugins.filter(
        (p) => !preferredVisibleIds.includes(p.id)
      );

      // Auto-fill empty slots based on available space
      let finalVisible = [...preferredVisible];
      let finalDropdown = [...remaining];

      if (
        finalVisible.length < visiblePluginCount &&
        finalDropdown.length > 0
      ) {
        const slotsToFill = visiblePluginCount - finalVisible.length;
        const pluginsToPromote = finalDropdown.splice(0, slotsToFill);
        finalVisible.push(...pluginsToPromote);
      }

      return {
        visiblePlugins: finalVisible.slice(0, visiblePluginCount), // Respect dynamic count
        dropdownPlugins: [
          ...finalDropdown,
          ...finalVisible.slice(visiblePluginCount),
        ],
      };
    }

    // Default behavior: respect dynamic plugin count
    return {
      visiblePlugins: navPlugins.slice(0, visiblePluginCount),
      dropdownPlugins: navPlugins.slice(visiblePluginCount),
    };
  }, [navPlugins, navbarPreferences.visiblePluginIds, visiblePluginCount]);

  // Fallback values if data fetch fails or is loading
  const daoName = daoInfo?.name || "Community Collective";
  const daoDescription = daoInfo?.description || "A community-driven organization";

  const isActive = (path: string) => {
    // Check if req exists and if the path is not 'creator-dashboard'
    if (!location.pathname.includes("/creator-dashboard")) {
      return location.pathname.endsWith(path);
    }
    return false;
  };

  const handleLinkClick = () => {
    // Smooth scroll to top when navigating
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-40 px-20 py-4 bg-slate-900 text-white backdrop-blur-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-10">
            <ExpandableLogo />
            <div className="hidden md:flex items-center space-x-10">
              <Link
                to={`/dao/${daoId}/home`}
                onClick={handleLinkClick}
                className={`transition-colors ${
                  isActive("/home")
                    ? "text-white font-semibold"
                    : "text-slate-400 hover:text-blue-200"
                }`}
                title={
                  isLoading
                    ? "Loading DAO information..."
                    : `${daoName} - ${daoDescription}`
                }
              >
                {isLoading ? (
                  <div className="animate-pulse bg-slate-600 h-4 w-24 rounded"></div>
                ) : (
                  truncateDAOName(daoName)
                )}
              </Link>
              <Link
                to={`/dao/${daoId}/transaction`}
                onClick={handleLinkClick}
                className={`transition-colors ${
                  isActive("/transaction")
                    ? "text-white font-semibold"
                    : "text-slate-400 hover:text-blue-200"
                }`}
              >
                Contributions
              </Link>
              <Link
                to={`/dao/${daoId}/plugins`}
                onClick={handleLinkClick}
                className={`transition-colors ${
                  isActive("/plugins")
                    ? "text-white font-semibold"
                    : "text-slate-400 hover:text-blue-200"
                }`}
              >
                Plugins
              </Link>

              {/* Vertical Separator */}
              {visiblePlugins.length > 0 && (
                <div className="h-5 w-px bg-slate-600"></div>
              )}

              {/* First 2 Plugin Navigation Items */}
              {visiblePlugins.map((plugin: any) => (
                <Link
                  key={plugin.id}
                  to={`/dao/${daoId}/${plugin.id}`}
                  onClick={handleLinkClick}
                  className={`transition-colors ${
                    isActive(`/${plugin.id}`)
                      ? "text-white font-semibold"
                      : "text-slate-400 hover:text-blue-200"
                  }`}
                  title={plugin.name} // Full name on hover
                >
                  {truncatePluginName(plugin.name)}
                </Link>
              ))}

              {/* More Plugins Dropdown */}
              {dropdownPlugins.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setPluginDropdownOpen(!pluginDropdownOpen)}
                    className="flex items-center space-x-1 text-slate-400 hover:text-blue-200 transition-colors"
                  >
                    <span>More</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        pluginDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {pluginDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-2 min-w-[200px] z-50"
                    >
                      {/* Customize Button */}
                      {navPlugins.length > 0 && (
                        <>
                          <button
                            onClick={() => {
                              setCustomizationModalOpen(true);
                              setPluginDropdownOpen(false);
                            }}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border-b border-slate-700 mb-1"
                          >
                            <Sliders className="w-4 h-4" />
                            <span>Customize Navigation</span>
                          </button>
                          {dropdownPlugins.length > 0 && (
                            <div className="border-b border-slate-700 mb-1"></div>
                          )}
                        </>
                      )}

                      {/* Plugin Links */}
                      {dropdownPlugins.map((plugin) => (
                        <Link
                          key={plugin.id}
                          to={`/dao/${daoId}/${plugin.id}`}
                          onClick={() => {
                            handleLinkClick();
                            setPluginDropdownOpen(false);
                          }}
                          className={`block px-4 py-2 text-sm transition-colors ${
                            isActive(`/${plugin.id}`)
                              ? "text-white bg-blue-600"
                              : "text-slate-300 hover:text-white hover:bg-slate-700"
                          }`}
                          title={plugin.name} // Full name on hover
                        >
                          {truncatePluginName(plugin.name, 20)}{" "}
                          {/* Slightly longer in dropdown */}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ConnectWallet />
            <Link
              to={`/dao/${daoId}/creator-dashboard`}
              onClick={handleLinkClick}
            >
              <motion.button
                className="flex items-center space-x-2 text-white/80 bg-blue-600/30 rounded-lg p-2 px-4 hover:text-blue-300 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                <Settings className="w-4 h-4" />
                <span>Creator Dashboard</span>
              </motion.button>
            </Link>
            <Link to={`/dao/${daoId}/profile`} onClick={handleLinkClick}>
              <motion.button whileHover={{ scale: 1.05 }}>
                <Avatar>
                  <AvatarFallback className="bg-white/60 text-black">
                    CN
                  </AvatarFallback>
                </Avatar>
              </motion.button>
            </Link>
            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pb-4 border-t border-slate-700"
          >
            <div className="flex flex-col space-y-3 pt-4">
              <Link
                to={`/dao/${daoId}/home`}
                onClick={handleLinkClick}
                className={`transition-colors font-semibold ${
                  isActive("/home/")
                    ? "text-blue-200 font-semibold"
                    : "text-white hover:text-blue-200"
                }`}
              >
                Home
              </Link>
              <Link
                to={`/dao/${daoId}/proposal`}
                onClick={handleLinkClick}
                className={`transition-colors ${
                  isActive("/proposal/")
                    ? "text-blue-200 font-semibold"
                    : "text-white hover:text-blue-200"
                }`}
              >
                Proposals
              </Link>
              <Link
                to={`/dao/${daoId}/plugins`}
                onClick={handleLinkClick}
                className={`transition-colors ${
                  isActive("/plugins")
                    ? "text-blue-200 font-semibold"
                    : "text-white hover:text-blue-200"
                }`}
              >
                Plugins
              </Link>
              {/* Plugin Navigation Items for Mobile */}
              {navPlugins.map((plugin) => (
                <Link
                  key={plugin.id}
                  to={`/dao/${daoId}/${plugin.id}`}
                  onClick={handleLinkClick}
                  className={`transition-colors ${
                    isActive(`/${plugin.id}`)
                      ? "text-blue-200 font-semibold"
                      : "text-white hover:text-blue-200"
                  }`}
                  title={plugin.name} // Full name on hover
                >
                  {truncatePluginName(plugin.name, 18)}{" "}
                  {/* Mobile gets more space */}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Plugin Customization Modal */}
      <PluginCustomizationModal
        isOpen={customizationModalOpen}
        onClose={() => setCustomizationModalOpen(false)}
      />
    </>
  );
};

export default NavbarDAO;
