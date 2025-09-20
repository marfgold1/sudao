import { HeroSection } from "./hero"
import { FeaturesSection } from "./features"
import { Marketplace } from "./marketplace"

export default function PluginMarketplace() {
    return (
        <main className="min-h-screen mx-auto">
            <HeroSection />
            <FeaturesSection />
            <Marketplace />
        </main>
    )
}
