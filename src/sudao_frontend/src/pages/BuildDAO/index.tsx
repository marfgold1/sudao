import type React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Check,
  Loader2,
  User,
  Package,
  Code,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useDAO } from "@/hooks/useDAO";
import { useAgents } from "@/hooks/useAgents";
import {
  isVariant,
  matchVariant,
  formatTime,
  keyVariant,
  iterLinkList,
} from "@/utils/converter";

interface Step {
  id: number;
  title: string;
  icon: React.ElementType;
  items: string[];
  duration: number;
}

interface DeploymentStep {
  step: number;
  stepName: string;
  currentAction: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  completedItems: number[];
  currentItemIndex: number;
}

// Removed static steps - now using dynamic steps

// Component to display detailed DAO and deployment information (from test.tsx)
const DetailedInfoSection: React.FC<{
  daoInfo?: {
    id: string;
    name: string;
    description: string;
    tags: string[];
    createdAt: bigint;
    creator: { toString: () => string };
  };
  deploymentInfo?: {
    status: any;
    createdAt: bigint;
    canisterIds: any;
  };
  onRefetch: () => void;
  className?: string;
  isDarkTheme?: boolean;
}> = ({
  daoInfo,
  deploymentInfo,
  onRefetch,
  className = "",
  isDarkTheme = true,
}) => {
  const textColors = isDarkTheme
    ? {
        heading: "text-blue-200",
        subheading: "text-blue-300",
        content: "text-blue-100",
        button: "text-blue-300 hover:text-blue-100",
      }
    : {
        heading: "text-slate-700",
        subheading: "text-slate-600",
        content: "text-slate-600",
        button: "text-slate-500 hover:text-slate-700",
      };

  const bgColors = isDarkTheme ? "bg-slate-800/50" : "bg-slate-100";
  const borderColors = isDarkTheme ? "border-slate-700/50" : "border-slate-300";

  return (
    <div className={`space-y-4 ${className}`}>
      {/* DAO Info Table */}
      {daoInfo && (
        <div>
          <h3
            className={`${textColors.heading} font-semibold mb-2 flex items-center`}
          >
            DAO Information
            <Button
              onClick={onRefetch}
              variant="ghost"
              size="sm"
              className={`ml-2 h-6 w-6 p-0 ${textColors.button}`}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </h3>
          <div className={`${bgColors} rounded-lg overflow-hidden`}>
            <table className="min-w-full">
              <tbody>
                {Object.entries({
                  ID: daoInfo.id,
                  Name: daoInfo.name,
                  Description: daoInfo.description,
                  Tags: daoInfo.tags.join(", "),
                  "Created At": formatTime(daoInfo.createdAt),
                  Creator: daoInfo.creator.toString(),
                }).map(([key, value]) => (
                  <tr
                    key={key}
                    className={`border-b ${borderColors} last:border-b-0`}
                  >
                    <td
                      className={`font-semibold px-3 py-2 ${textColors.subheading} text-xs`}
                    >
                      {key}
                    </td>
                    <td
                      className={`px-3 py-2 ${textColors.content} text-xs break-all`}
                    >
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deployment Info Table */}
      {deploymentInfo && (
        <div>
          <h3 className={`${textColors.heading} font-semibold mb-2`}>
            Deployment Information
          </h3>
          <div className={`${bgColors} rounded-lg overflow-hidden`}>
            <table className="min-w-full">
              <tbody>
                {Object.entries({
                  Status: matchVariant(deploymentInfo.status, {
                    deployed: (val: any) =>
                      `Deployed at ${formatTime(val.deployedAt)}`,
                    deploying: (val: any) =>
                      `Deployment started at ${formatTime(
                        val.startedAt
                      )} and currently in step: ${matchVariant(val.step, {
                        creating_canister: (v: any) =>
                          `creating canister ${normalizeCanisterTypeName(
                            String(keyVariant(v))
                          )}`,
                        installing_code: (v: any) =>
                          `installing code ${normalizeCanisterTypeName(
                            String(keyVariant(v))
                          )}`,
                      })}`,
                    failed: (val: any) =>
                      `Deployment failed at ${formatTime(
                        val.failedAt
                      )} with error: ${val.errorMessage}`,
                    queued: () => "Deployment queued",
                  }),
                  "Created At": formatTime(deploymentInfo.createdAt),
                  "Canister IDs": Array.from(
                    iterLinkList(deploymentInfo.canisterIds)
                  )
                    .map(
                      ([codeType, canisterId]: [any, any]) =>
                        `${normalizeCanisterTypeName(
                          String(keyVariant(codeType))
                        )}: ${canisterId.toString()}`
                    )
                    .join(", "),
                }).map(([key, value]) => (
                  <tr
                    key={key}
                    className={`border-b ${borderColors} last:border-b-0`}
                  >
                    <td
                      className={`font-semibold px-3 py-2 ${textColors.subheading} text-xs`}
                    >
                      {key}
                    </td>
                    <td
                      className={`px-3 py-2 ${textColors.content} text-xs break-all`}
                    >
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Function to normalize canister type names for consistent UI display
const normalizeCanisterTypeName = (
  canisterType: string | undefined
): string => {
  if (!canisterType) return "unknown";

  switch (canisterType) {
    case "swap":
      return "AMM";
    case "backend":
      return "backend";
    case "ledger":
      return "ledger";
    default:
      return canisterType;
  }
};

// Function to generate dynamic step items based on actual deployment order
const generateDynamicStepItems = (
  stepType: "creating" | "installing",
  order: string[]
): string[] => {
  return order.map((canisterType) => {
    const normalizedName = normalizeCanisterTypeName(canisterType);
    return stepType === "creating"
      ? `Creating ${normalizedName} canister`
      : `Installing ${normalizedName} code`;
  });
};

const BuildDAO: React.FC = () => {
  const { daoId } = useParams<{ daoId: string }>();
  const navigate = useNavigate();
  const { daoInfo, deploymentInfo, refetch } = useDAO();
  const { agents } = useAgents();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [status, setStatus] = useState<
    "in-progress" | "fading-out" | "complete"
  >("in-progress");
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [icpAmount, setIcpAmount] = useState("");

  // Dynamic tracking of deployment progress
  const [deploymentProgress, setDeploymentProgress] = useState({
    canisterCreationOrder: [] as string[],
    codeInstallationOrder: [] as string[],
    createdCanisters: new Set<string>(),
    installedCode: new Set<string>(),
  });

  // Separate effect to track deployment progress - this prevents infinite loops
  useEffect(() => {
    if (!deploymentInfo) return;

    matchVariant(deploymentInfo.status, {
      queued: () => {
        // Nothing to track for queued state
      },
      deploying: (val) => {
        matchVariant(val.step, {
          creating_canister: (v) => {
            const canisterType = keyVariant(v);
            if (canisterType) {
              setDeploymentProgress((prev) => {
                const newOrder = [...prev.canisterCreationOrder];
                const newCreated = new Set(prev.createdCanisters);

                if (!newOrder.includes(canisterType)) {
                  newOrder.push(canisterType);
                }
                newCreated.add(canisterType);

                return {
                  ...prev,
                  canisterCreationOrder: newOrder,
                  createdCanisters: newCreated,
                };
              });
            }
          },
          installing_code: (v) => {
            const canisterType = keyVariant(v);
            if (canisterType) {
              setDeploymentProgress((prev) => {
                const newOrder = [...prev.codeInstallationOrder];
                const newInstalled = new Set(prev.installedCode);

                if (!newOrder.includes(canisterType)) {
                  newOrder.push(canisterType);
                }
                newInstalled.add(canisterType);

                return {
                  ...prev,
                  codeInstallationOrder: newOrder,
                  installedCode: newInstalled,
                };
              });
            }
          },
        });
      },
      deployed: () => {
        // Nothing to track for deployed state
      },
      failed: () => {
        // Nothing to track for failed state
      },
    });
  }, [deploymentInfo]);

  // Function to get the actual deployment step and information (now pure function)
  const getDeploymentStep = useCallback((): DeploymentStep => {
    if (!deploymentInfo) {
      return {
        step: 0,
        stepName: "Queued",
        currentAction: "Waiting for deployment to start...",
        completedItems: [],
        currentItemIndex: 0,
      };
    }

    return matchVariant(deploymentInfo.status, {
      queued: (): DeploymentStep => ({
        step: 0,
        stepName: "Queued",
        currentAction: "Deployment request queued",
        startedAt: formatTime(deploymentInfo.createdAt),
        completedItems: [0], // Mark first item as completed
        currentItemIndex: 1, // Working on second item
      }),
      deploying: (val): DeploymentStep => {
        const deployStep = matchVariant(val.step, {
          creating_canister: (v): DeploymentStep => {
            const canisterType = keyVariant(v);

            // Find current canister's position in the actual order
            const currentIndex =
              deploymentProgress.canisterCreationOrder.indexOf(
                canisterType || ""
              );
            const completedItems = Array.from(
              { length: currentIndex },
              (_, i) => i
            );

            return {
              step: 1, // Always step 1 for creating canisters
              stepName: "Creating Canisters",
              currentAction: `Creating ${normalizeCanisterTypeName(
                canisterType
              )} canister...`,
              startedAt: formatTime(val.startedAt),
              completedItems,
              currentItemIndex: Math.max(0, currentIndex),
            };
          },
          installing_code: (v): DeploymentStep => {
            const canisterType = keyVariant(v);

            // Find current canister's position in the actual order
            const currentIndex =
              deploymentProgress.codeInstallationOrder.indexOf(
                canisterType || ""
              );
            const completedItems = Array.from(
              { length: currentIndex },
              (_, i) => i
            );

            return {
              step: 2, // Always step 2 for installing code
              stepName: "Installing Code",
              currentAction: `Installing ${normalizeCanisterTypeName(
                canisterType
              )} code...`,
              startedAt: formatTime(val.startedAt),
              completedItems,
              currentItemIndex: Math.max(0, currentIndex),
            };
          },
        });
        return deployStep;
      },
      deployed: (val): DeploymentStep => ({
        step: 3,
        stepName: "Finalizing",
        currentAction: "DAO deployment complete!",
        completedAt: formatTime(val.deployedAt),
        completedItems: [0, 1], // All finalizing items completed
        currentItemIndex: 1,
      }),
      failed: (val): DeploymentStep => ({
        step: -1,
        stepName: "Failed",
        currentAction: `Deployment failed: ${val.errorMessage}`,
        failedAt: formatTime(val.failedAt),
        completedItems: [],
        currentItemIndex: 0,
      }),
    });
  }, [deploymentInfo, deploymentProgress]);

  // Generate dynamic steps based on actual deployment progress
  const dynamicSteps: Step[] = useMemo(
    () => [
      {
        id: 1,
        title: "Queued",
        icon: User,
        items: [
          "Deployment request received",
          "Initializing deployment process",
        ],
        duration: 2000,
      },
      {
        id: 2,
        title: "Creating Canisters",
        icon: Package,
        items:
          deploymentProgress.canisterCreationOrder.length > 0
            ? generateDynamicStepItems(
                "creating",
                deploymentProgress.canisterCreationOrder
              )
            : [
                "Creating backend canister",
                "Creating AMM canister",
                "Creating ledger canister",
              ], // fallback
        duration: 6000,
      },
      {
        id: 3,
        title: "Installing Code",
        icon: Code,
        items:
          deploymentProgress.codeInstallationOrder.length > 0
            ? generateDynamicStepItems(
                "installing",
                deploymentProgress.codeInstallationOrder
              )
            : [
                "Installing backend code",
                "Installing AMM code",
                "Installing ledger code",
              ], // fallback
        duration: 6000,
      },
      {
        id: 4,
        title: "Finalizing",
        icon: Clock,
        items: ["Configuring canister settings", "DAO deployment complete!"],
        duration: 3000,
      },
    ],
    [
      deploymentProgress.canisterCreationOrder,
      deploymentProgress.codeInstallationOrder,
    ]
  );

  // Effect to monitor deployment status and auto-progress
  useEffect(() => {
    if (!deploymentInfo) return;

    const deploymentStep = getDeploymentStep();

    // Update current step based on real deployment progress
    // Don't update if we're already at step 4 (completion screen)
    if (
      deploymentStep.step !== currentStep &&
      deploymentStep.step >= 0 &&
      currentStep < 4
    ) {
      setCurrentStep(deploymentStep.step);
    }

    // Update completed items and current item index from deployment step
    setCompletedItems(deploymentStep.completedItems);
    setCurrentItemIndex(deploymentStep.currentItemIndex);

    // Check if deployment is complete
    if (isVariant(deploymentInfo.status, "deployed")) {
      // Set to step 3 (Finalizing) for deployed status, but only if we haven't reached completion screen yet
      if (currentStep !== 3 && currentStep < 4) {
        setCurrentStep(3);
      }
      // Stop auto-refresh when deployed OR when we've reached completion screen
      if (currentStep >= 4) {
        return;
      }
      return;
    }

    // Check if deployment failed - stop all progression
    if (isVariant(deploymentInfo.status, "failed")) {
      // Stop auto-refresh and step progression when failed
      setCurrentStep(deploymentStep.step); // Set to failed step
      setStatus("complete"); // Show final form but with error state
      return;
    }

    // Auto-refresh deployment status
    const timeout = setTimeout(() => {
      refetch();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [
    deploymentInfo,
    refetch,
    currentStep,
    getDeploymentStep,
    dynamicSteps.length,
  ]);

  // Separate effect to handle progression from Finalizing to completion
  useEffect(() => {
    if (isVariant(deploymentInfo?.status, "deployed") && currentStep === 3) {
      const timeout = setTimeout(() => {
        setCurrentStep(4); // Move to completion screen
      }, 700);

      return () => clearTimeout(timeout);
    }
  }, [deploymentInfo, currentStep]);

  // Separate effect to handle completion screen transition
  useEffect(() => {
    if (currentStep >= dynamicSteps.length) {
      // All steps are finished, start the fade-out animation
      setStatus("fading-out");

      const timeout = setTimeout(() => {
        setStatus("complete");
      }, 700); // Wait for fade-out animation

      return () => clearTimeout(timeout);
    }
  }, [currentStep, dynamicSteps.length, navigate, daoId]);

  useEffect(() => {
    let isCancelled = false;

    const runSteps = async () => {
      // Don't run step animations if deployment failed
      if (deploymentInfo && isVariant(deploymentInfo.status, "failed")) {
        return;
      }

      if (currentStep >= dynamicSteps.length) {
        // Completion handled by separate useEffect
        return;
      }

      // Don't run automatic step progression - let deployment status drive it
      // The steps and items are now controlled by real deployment status
    };

    runSteps();

    return () => {
      isCancelled = true;
    };
  }, [currentStep, deploymentInfo, dynamicSteps.length]);

  const handleProceed = async () => {
    // Mark initial investment as completed before navigating
    if (daoId) {
      try {
        await agents.explorerDao.markInitialInvestmentCompleted(daoId);
        console.log("✅ Initial investment marked as completed");
      } catch (error) {
        console.error(
          "❌ Failed to mark initial investment as completed:",
          error
        );
        // Continue anyway - user can still proceed to make investment
      }

      // Navigate to DAO home page with ICP amount
      navigate(`/dao/${daoId}/home`, {
        state: { initialIcpAmount: icpAmount },
      });
    }
  };

  const step = dynamicSteps[currentStep];
  const totalSteps = dynamicSteps.length;
  const deploymentStep = getDeploymentStep();

  const renderCard = (
    stepData: Step,
    position: "previous" | "current" | "next",
    stepIndex: number
  ) => {
    const isCurrentStep = position === "current";
    const isPrevious = position === "previous";
    const Icon = stepData.icon;

    // Apply fade-out classes to the card container when status is 'fading-out'
    const isFadingOut = status === "fading-out" && isCurrentStep;

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
                                ${
                                  isCurrentStep
                                    ? "bg-blue-800/50 ring-1 ring-blue-500 ring-offset-slate-900"
                                    : "bg-slate-700"
                                }`}
              >
                <div
                  className={`absolute inset-0 rounded-full ${
                    isCurrentStep ? "bg-blue-600/80 opacity-10" : ""
                  }`}
                ></div>
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center
                                            ${
                                              isCurrentStep
                                                ? "bg-blue-600"
                                                : "bg-slate-600"
                                            }`}
                >
                  <Icon className="w-12 h-12 text-white/90" />
                </div>
              </div>
            </div>
            <h2
              className={`text-2xl font-semibold mb-2 ${
                isCurrentStep ? "text-white" : "text-gray-300"
              }`}
            >
              {stepData.title}
            </h2>
            <p
              className={`text-sm ${
                isCurrentStep ? "text-blue-200" : "text-gray-400"
              }`}
            >
              {stepIndex + 1} of {totalSteps} Steps{" "}
              {isCurrentStep ? "Processing" : "Completed"}
            </p>
          </div>

          <div className="space-y-3">
            {stepData.items.map((item: string, index) => {
              // Use deployment step data if available and this is the current step
              const useRealData =
                isCurrentStep && deploymentStep.step === stepIndex;
              const isCompleted = useRealData
                ? deploymentStep.completedItems.includes(index)
                : currentStep > stepIndex ||
                  (isCurrentStep && completedItems.includes(index));
              const isActive = useRealData
                ? index === deploymentStep.currentItemIndex &&
                  !deploymentStep.completedItems.includes(index)
                : isCurrentStep && !isCompleted && index === currentItemIndex;

              // Show real deployment action if this is the current step and active
              const displayText =
                isCurrentStep && isActive && deploymentStep.currentAction
                  ? deploymentStep.currentAction
                  : item;

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
                    {displayText}
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
        backgroundImage:
          "linear-gradient(135deg, #000020 0%, #002553 50%, #000020 100%)",
        minHeight: "100vh",
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-white text-3xl font-bold mb-4">
            Making Your DAO...
          </h1>
          <p className="text-blue-200 text-sm">
            Please buckle up! We're directing you to your website in just a
            minute.
          </p>

          {/* Live Deployment Status */}
          {deploymentInfo && (
            <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
              <div className="text-left">
                <h3 className="text-blue-200 font-semibold mb-2 flex items-center justify-between">
                  Live Status
                  <Button
                    onClick={() => setShowDetailedInfo(!showDetailedInfo)}
                    variant="ghost"
                    size="sm"
                    className="text-blue-300 hover:text-blue-100 h-6 px-2 text-xs"
                  >
                    {showDetailedInfo ? "Hide Details" : "Show Details"}
                  </Button>
                </h3>
                <div className="text-sm text-blue-100 space-y-1">
                  <p>
                    <span className="text-blue-300">Step:</span>{" "}
                    {deploymentStep.stepName}
                  </p>
                  <p>
                    <span className="text-blue-300">Action:</span>{" "}
                    {deploymentStep.currentAction}
                  </p>
                  {deploymentStep.startedAt && (
                    <p>
                      <span className="text-blue-300">Started:</span>{" "}
                      {deploymentStep.startedAt}
                    </p>
                  )}
                  {deploymentStep.completedAt && (
                    <p>
                      <span className="text-blue-300">Completed:</span>{" "}
                      {deploymentStep.completedAt}
                    </p>
                  )}
                  {deploymentStep.failedAt && (
                    <p>
                      <span className="text-red-300">Failed:</span>{" "}
                      {deploymentStep.failedAt}
                    </p>
                  )}
                </div>

                {/* Detailed Information Section */}
                {showDetailedInfo && (
                  <div className="mt-4 pt-4 border-t border-blue-500/30">
                    <DetailedInfoSection
                      daoInfo={daoInfo}
                      deploymentInfo={deploymentInfo}
                      onRefetch={refetch}
                      isDarkTheme={true}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative h-96 perspective-1000">
          {/* Step-by-step UI: Fades out and disappears */}
          <div
            className={`transition-all duration-700 ${
              status === "complete"
                ? "opacity-0 scale-90 pointer-events-none"
                : ""
            }`}
          >
            {/* Previous card */}
            {currentStep > 0 &&
              renderCard(
                dynamicSteps[currentStep - 1],
                "previous",
                currentStep - 1
              )}
            {/* Current card */}
            {step && renderCard(step, "current", currentStep)}
            {/* Next card */}
            {currentStep < dynamicSteps.length - 1 &&
              renderCard(
                dynamicSteps[currentStep + 1],
                "next",
                currentStep + 1
              )}
          </div>

          {/* Final card UI: Fades in and slides up */}
          <div
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              status === "complete"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-16"
            }`}
          >
            <Card className="bg-white backdrop-blur-sm mt-[2rem] border-slate-600/50 p-6 shadow-2xl transition-all duration-700 ease-out">
              <div className="text-center p-6 py-0 pb-4 mt-[-4rem]">
                <div className="flex flex-col items-center">
                  <div
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 p-1 ${
                      deploymentInfo &&
                      isVariant(deploymentInfo.status, "failed")
                        ? "bg-red-800/50 ring-1 ring-red-500 ring-offset-slate-900"
                        : "bg-blue-800/50 ring-1 ring-blue-500 ring-offset-slate-900"
                    }`}
                  >
                    <div
                      className={`absolute inset-0 rounded-full ${
                        deploymentInfo &&
                        isVariant(deploymentInfo.status, "failed")
                          ? "bg-red-600/80 opacity-10"
                          : "bg-blue-600/80 opacity-10"
                      }`}
                    ></div>
                    <div
                      className={`w-full h-full rounded-full flex items-center justify-center ${
                        deploymentInfo &&
                        isVariant(deploymentInfo.status, "failed")
                          ? "bg-red-600"
                          : "bg-blue-600"
                      }`}
                    >
                      {deploymentInfo &&
                      isVariant(deploymentInfo.status, "failed") ? (
                        <span className="text-white text-4xl font-bold">⚠</span>
                      ) : (
                        <span className="text-white text-5xl font-bold">₿</span>
                      )}
                    </div>
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  {deploymentInfo && isVariant(deploymentInfo.status, "failed")
                    ? "Deployment Failed"
                    : "DAO Ready!"}
                </h2>
              </div>

              <div className="space-y-4">
                {deploymentInfo &&
                isVariant(deploymentInfo.status, "failed") ? (
                  // Failed deployment UI
                  <div className="text-center">
                    <p className="text-red-700 text-sm mb-4">
                      Your DAO deployment encountered an error. Please try again
                      or contact support if the problem persists.
                    </p>
                    <Button
                      onClick={() => window.location.reload()}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 transition-colors"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
                  // Successful deployment UI with ICP investment form
                  <div>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        🎉 DAO Successfully Deployed!
                      </h3>
                      <p className="text-blue-700 text-sm mb-4">
                        Your DAO is ready! Enter your starting ICP to kickstart
                        the treasury.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium block mb-2">
                          Enter Starting ICP
                        </label>
                        <Input
                          type="number"
                          step="0.001"
                          value={icpAmount}
                          onChange={(e) => setIcpAmount(e.target.value)}
                          className="border-slate-500/50 placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400"
                          placeholder="0.001"
                        />
                        <p className="text-blue-700 text-xs mt-2 leading-relaxed">
                          Choose how much ICP to kickstart your DAO. The amount
                          you enter will be locked in as your DAO's first
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
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildDAO;
