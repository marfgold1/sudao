import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Check, Loader2, User, Package, Code, Clock } from "lucide-react";

interface Step {
    id: number;
    title: string;
    icon: React.ElementType;
    items: string[];
    duration: number;
}

const steps: Step[] = [
    {
        id: 1,
        title: "Queue",
        icon: User,
        items: ["Initializing process..."],
        duration: 2000,
    },
    {
        id: 2,
        title: "Creating Canister",
        icon: Package,
        items: ["Created AMM Canister", "Created AMM Canister", "Creating Lorem Canister"],
        duration: 4000,
    },
    {
        id: 3,
        title: "Installing Code",
        icon: Code,
        items: ["Anak Step 1", "Anak Step 2", "Creating Lorem Canister"],
        duration: 4000,
    },
    {
        id: 4,
        title: "Finishing",
        icon: Clock,
        items: ["Anak Step 1", "Finished Deploying"],
        duration: 3000,
    },
];

const BuildDAO: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedItems, setCompletedItems] = useState<number[]>([]);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [status, setStatus] = useState<'in-progress' | 'fading-out' | 'complete'>('in-progress');
    const [icpAmount, setIcpAmount] = useState("0.001");

    useEffect(() => {
        let isCancelled = false;
        
        const runSteps = async () => {
            if (currentStep >= steps.length) {
                // All steps are finished, start the fade-out animation
                setStatus('fading-out');
                // Wait for the fade-out animation to complete (700ms) before transitioning to the final view
                await new Promise(resolve => setTimeout(resolve, 700));
                if (!isCancelled) {
                    setStatus('complete');
                }
                return;
            }

            const step = steps[currentStep];
            if (!step) return;

            setCurrentItemIndex(0);
            setCompletedItems([]);
            
            const itemDelay = step.duration / step.items.length;

            for (let i = 0; i < step.items.length; i++) {
                if (isCancelled) return;
                setCurrentItemIndex(i);
                await new Promise(resolve => setTimeout(resolve, itemDelay));
                if (isCancelled) return;
                setCompletedItems(prev => [...prev, i]);
                
                if (i < step.items.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }

            if (!isCancelled) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                setCurrentStep(prev => prev + 1);
            }
        };

        runSteps();

        return () => {
            isCancelled = true;
        };
    }, [currentStep]);

    const handleProceed = () => {
        console.log("DAO creation completed with ICP amount:", icpAmount);
    };

    const step = steps[currentStep];
    const totalSteps = steps.length;

    const renderCard = (stepData: Step, position: "previous" | "current" | "next", stepIndex: number) => {
        const isCurrentStep = position === "current";
        const isPrevious = position === "previous";
        const Icon = stepData.icon;

        // Apply fade-out classes to the card container when status is 'fading-out'
        const isFadingOut = status === 'fading-out' && isCurrentStep;

        return (
            <Card
                key={stepData.id}
                className={`absolute mt-10 inset-0 transition-all duration-700 ease-in-out ${
                    isFadingOut
                        ? "z-30 scale-90 opacity-0 -translate-y-16" // Fade and slide up when done
                        : isCurrentStep
                            ? "z-30 scale-100 opacity-100 translate-x-0 bg-blue-800 backdrop-blur-sm border-slate-600/50 shadow-2xl"
                            : isPrevious
                                ? "z-10 scale-90 opacity-40 -translate-x-24 translate-y-2 bg-slate-800/60 backdrop-blur-sm border-slate-600/30 shadow-lg"
                                : "z-20 scale-90 opacity-40 translate-x-24 translate-y-2 bg-slate-800/60 backdrop-blur-sm border-slate-600/30 shadow-lg"
                }`}
                style={{
                    transformStyle: "preserve-3d",
                }}
            >
                <div className="p-6 pt-0 mt-[-3rem]">
                    <div className="text-center mb-6">
                        <div className="flex flex-col items-center">
                            <div
                                className={`relative w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 p-1
                                ${isCurrentStep ? "bg-blue-800/50 ring-1 ring-blue-500 ring-offset-slate-900" : "bg-slate-700"
                                }`}
                            >
                                <div className={`absolute inset-0 rounded-full ${isCurrentStep ? "bg-blue-600/80 opacity-10" : ""}`}></div>
                                    <div
                                        className={`w-full h-full rounded-full flex items-center justify-center
                                            ${isCurrentStep ? "bg-blue-600" : "bg-slate-600"
                                            }`}
                                    >
                                    <Icon className="w-12 h-12 text-white/90" />
                                </div>
                            </div>
                        </div>
                        <h2 className={`text-2xl font-semibold mb-2 ${isCurrentStep ? "text-white" : "text-gray-300"}`}>
                            {stepData.title}
                        </h2>
                        <p className={`text-sm ${isCurrentStep ? "text-blue-200" : "text-gray-400"}`}>
                            {stepIndex + 1} of {totalSteps} Steps {isCurrentStep ? "Processing" : "Completed"}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {stepData.items.map((item: any, index) => {
                            const isCompleted = currentStep > stepIndex || (isCurrentStep && completedItems.includes(index));
                            const isActive = isCurrentStep && !isCompleted && index === currentItemIndex;

                            return (
                                <div
                                    key={index}
                                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                                        isCompleted
                                            ? "bg-green-600/20 border border-green-500/30"
                                            : isActive
                                                ? "bg-slate-700/50 border border-slate-500/50"
                                                : "bg-slate-800/30 border border-slate-600/30 opacity-60"
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                                            isCompleted
                                                ? "bg-green-500"
                                                : isActive
                                                    ? "bg-slate-500"
                                                    : "bg-slate-600"
                                        }`}
                                    >
                                        {isCompleted ? (
                                            <Check className="w-3 h-3 text-white" />
                                        ) : isActive ? (
                                            <Loader2 className="w-3 h-3 text-white animate-spin" />
                                        ) : null}
                                    </div>
                                    <span
                                        className={`text-sm transition-colors duration-300 ${
                                            isCompleted
                                                ? "text-green-200 font-medium"
                                                : isActive
                                                    ? "text-white"
                                                    : "text-gray-400"
                                        }`}
                                    >
                                        {item}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                backgroundColor: "#000020",
                backgroundImage: "linear-gradient(135deg, #000020 0%, #002553 50%, #000020 100%)",
                minHeight: "100vh",
            }}
        >
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <h1 className="text-white text-3xl font-bold mb-4">Making Your DAO...</h1>
                    <p className="text-blue-200 text-sm">
                        Please buckle up! We're directing you to your website in just a minute.
                    </p>
                </div>

                <div className="relative h-96 perspective-1000">
                    {/* Step-by-step UI: Fades out and disappears */}
                    <div className={`transition-all duration-700 ${status === 'complete' ? 'opacity-0 scale-90 pointer-events-none' : ''}`}>
                        {/* Previous card */}
                        {currentStep > 0 && renderCard(steps[currentStep - 1], "previous", currentStep - 1)}
                        {/* Current card */}
                        {step && renderCard(step, "current", currentStep)}
                        {/* Next card */}
                        {currentStep < steps.length - 1 && renderCard(steps[currentStep + 1], "next", currentStep + 1)}
                    </div>
                    
                    {/* Final card UI: Fades in and slides up */}
                    <div className={`absolute inset-0 transition-all duration-700 ease-out ${status === 'complete' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
                        <Card 
                            className="bg-white backdrop-blur-sm mt-[2rem] border-slate-600/50 p-6 shadow-2xl transition-all duration-700 ease-out"
                        >
                            <div className="text-center p-6 py-0 pb-4 mt-[-4rem]">
                                <div className="flex flex-col items-center">
                                    <div
                                        className="relative w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 p-1
                                        bg-blue-800/50 ring-1 ring-blue-500 ring-offset-slate-900"
                                    >
                                        <div className="absolute inset-0 rounded-full bg-blue-600/80 opacity-10"></div>
                                            <div
                                                className="w-full h-full rounded-full flex items-center justify-center
                                                    bg-blue-600"
                                            >
                                            <span className="text-white text-5xl font-bold">₿</span>
                                        </div>
                                    </div>
                                </div>
                                <h2 className="text-xl font-semibold mb-2">Complete Your DAO</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium block mb-2">Enter Starting ICP</label>
                                    <Input
                                        type="number"
                                        step="0.001"
                                        value={icpAmount}
                                        onChange={(e) => setIcpAmount(e.target.value)}
                                        className="border-slate-500/50 placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400"
                                        placeholder="0.001"
                                    />
                                    <p className="text-blue-700 text-xs mt-2 leading-relaxed">
                                        Choose how much ICP to kickstart your DAO. The amount you enter will be locked in as your DAO's first
                                        treasury to support decisions and projects.
                                    </p>
                                </div>

                                <Button
                                    onClick={handleProceed}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 transition-colors"
                                >
                                    Proceed
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuildDAO;