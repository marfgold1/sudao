import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { ArrowLeft, Search } from "lucide-react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Proposal } from "@/types"
import { useAccount } from "@/hooks/useAccount"
import { ProposalArgs } from "@/hooks/useProposals"

interface FormData {
    title: string;
    description: string;
    beneficiary: string;
    proposalType: string;
    fundingAmount: string;
    votingDeadline: string;
    minParticipation: string;
    minApproval: string;
}

interface ValidationErrors {
    [key: string]: string;
}

const ProposalCreation: React.FC<{ onBack: any, onDraftCreated?: (args: ProposalArgs, shouldPublish?: boolean) => void, editingProposal?: Proposal | null }> = ({ onBack, onDraftCreated, editingProposal }) => {
    const { currentAccount } = useAccount();
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState<FormData>({
        title: editingProposal?.title || "",
        description: editingProposal?.description || "",
        beneficiary: currentAccount?.principal.toString() || "",
        proposalType: "Asking for funds",
        fundingAmount: editingProposal?.fundingAmount?.toString() || "",
        votingDeadline: editingProposal?.deadline || "",
        minParticipation: "60%",
        minApproval: "16 members",
    })
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [_, setIsDraft] = useState(false)

    // Scroll to top when component mounts or step changes
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    const steps = [
        { number: 1, title: "Details", active: currentStep === 1 },
        { number: 2, title: "Information", active: currentStep === 2 },
        { number: 3, title: "Preview", active: currentStep === 3 },
    ]

    const validateStep = (step: number): boolean => {
        const errors: ValidationErrors = {};
        
        if (step === 1) {
            if (!formData.title.trim()) {
                errors.title = "Title is required";
            } else if (formData.title.length > 50) {
                errors.title = "Title must be under 50 characters";
            }
            
            if (!formData.description.trim()) {
                errors.description = "Description is required";
            } else if (formData.description.length < 10) {
                errors.description = "Description must be at least 10 characters";
            }
        }
        
        if (step === 2) {
            if (!formData.fundingAmount.trim()) {
                errors.fundingAmount = "Funding amount is required";
            } else if (isNaN(Number(formData.fundingAmount.replace(/[^0-9.]/g, '')))) {
                errors.fundingAmount = "Please enter a valid number";
            }
            
            if (!formData.votingDeadline.trim()) {
                errors.votingDeadline = "Voting deadline is required";
            }
            
            if (!formData.minParticipation.trim()) {
                errors.minParticipation = "Minimum participation is required";
            }
            
            if (!formData.minApproval.trim()) {
                errors.minApproval = "Minimum approval is required";
            }
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep) && currentStep < 3) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        } else {
            onBack()
        }
    }

    const handleSaveDraft = () => {
        if (validateStep(1) && validateStep(2)) {
            const proposalArgs = {
                title: formData.title,
                description: formData.description,
                proposalType: 'funding' as const,
                beneficiaryAddress: currentAccount?.principal.toString(),
                requestedAmount: Number(formData.fundingAmount.replace(/[^0-9.]/g, '')) || 0,
                votingDurationHours: 168,
                minimumParticipation: parseInt(formData.minParticipation.replace('%', '')) || 50,
                minimumApproval: parseInt(formData.minApproval.replace(/[^0-9]/g, '')) || 51
            };
            
            if (onDraftCreated) {
                onDraftCreated(proposalArgs, false);
            }
        }
    };

    const handlePublish = () => {
        if (validateStep(1) && validateStep(2)) {
            setIsDraft(false);
            setShowConfirmation(true);
        }
    }

    const confirmPublish = () => {
        const proposalArgs = {
            title: formData.title,
            description: formData.description,
            proposalType: 'funding' as const,
            beneficiaryAddress: currentAccount?.principal.toString(),
            requestedAmount: Number(formData.fundingAmount.replace(/[^0-9.]/g, '')) || 0,
            votingDurationHours: 168,
            minimumParticipation: parseInt(formData.minParticipation.replace('%', '')) || 50,
            minimumApproval: parseInt(formData.minApproval.replace(/[^0-9]/g, '')) || 51
        };
        
        setShowConfirmation(false);
        if (onDraftCreated) {
            onDraftCreated(proposalArgs, true);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
        >
            {/* Header */}
            <div className="flex items-center mb-6">
                <Button variant="ghost" size="sm" onClick={onBack} className="mr-4">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
            </div>

            <Card>
                <CardContent className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold mb-2">MAKE A NEW PROPOSAL</h1>
                        <p className="text-gray-600">Create a new proposal for Yayasan Anak Muda Indonesia</p>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-center mb-8">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center">
                                <motion.div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                        step.active || currentStep > step.number
                                        ? "bg-blue-600 border-blue-600 text-white"
                                        : "border-gray-300 text-gray-400"
                                    }`}
                                    whileHover={{ scale: 1.1 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    {step.number}
                                </motion.div>
                                <div className="ml-2 mr-8">
                                    <p className={`text-sm ${step.active ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                                        {step.title}
                                    </p>
                                </div>
                                {index < steps.length - 1 && <div className="w-16 h-px bg-gray-300 mr-8"></div>}
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {currentStep === 1 && (
                            <div className="space-y-6 max-h-[80vh] overflow-y-auto">
                                <div>
                                    <Label htmlFor="title" className="block text-sm font-medium mb-2">Proposal title *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => {
                                            setFormData({ ...formData, title: e.target.value });
                                            if (validationErrors.title) {
                                                setValidationErrors({ ...validationErrors, title: '' });
                                            }
                                        }}
                                        className={`w-full ${validationErrors.title ? 'border-red-500 focus:border-red-500' : ''}`}
                                        placeholder="Enter proposal title"
                                    />
                                    {validationErrors.title && (
                                        <p className="text-sm text-red-500 mt-1">{validationErrors.title}</p>
                                    )}
                                    <p className="text-sm text-gray-500 mt-1">
                                        The name should be clear, under 50 characters, and avoid special symbols or emojis. ({formData.title.length}/50)
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="description" className="block text-sm font-medium mb-2">Description *</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => {
                                            setFormData({ ...formData, description: e.target.value });
                                            if (validationErrors.description) {
                                                setValidationErrors({ ...validationErrors, description: '' });
                                            }
                                        }}
                                        rows={6}
                                        className={`w-full resize-none ${validationErrors.description ? 'border-red-500 focus:border-red-500' : ''}`}
                                        placeholder="Enter detailed description of your proposal"
                                    />
                                    {validationErrors.description && (
                                        <p className="text-sm text-red-500 mt-1">{validationErrors.description}</p>
                                    )}
                                    <p className="text-sm text-gray-500 mt-1">Enter what's best describe your collective. (minimum 10 characters)</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Beneficiary Address</label>
                                    <div className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
                                        <Avatar>
                                            <AvatarFallback>ME</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-medium">Your Account</p>
                                            <p className="text-sm text-gray-500 font-mono">
                                                {currentAccount ? 
                                                    `${currentAccount.principal.toString().slice(0, 8)}...${currentAccount.principal.toString().slice(-8)}` : 
                                                    'Not connected'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Proposals are automatically created for your connected account.</p>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Proposal Type</label>
                                    <Input value={formData.proposalType} readOnly className="w-full bg-gray-50" />
                                </div>

                                <div>
                                    <Label htmlFor="fundingAmount" className="block text-sm font-medium mb-2">Requested Funding Amount *</Label>
                                    <Input
                                        id="fundingAmount"
                                        value={formData.fundingAmount}
                                        onChange={(e) => {
                                            setFormData({ ...formData, fundingAmount: e.target.value });
                                            if (validationErrors.fundingAmount) {
                                                setValidationErrors({ ...validationErrors, fundingAmount: '' });
                                            }
                                        }}
                                        className={`w-full ${validationErrors.fundingAmount ? 'border-red-500 focus:border-red-500' : ''}`}
                                        placeholder="e.g., 100 ICP"
                                    />
                                    {validationErrors.fundingAmount && (
                                        <p className="text-sm text-red-500 mt-1">{validationErrors.fundingAmount}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="votingDeadline" className="block text-sm font-medium mb-2">Voting Deadline *</Label>
                                    <Input
                                        id="votingDeadline"
                                        type="date"
                                        value={formData.votingDeadline}
                                        onChange={(e) => {
                                            setFormData({ ...formData, votingDeadline: e.target.value });
                                            if (validationErrors.votingDeadline) {
                                                setValidationErrors({ ...validationErrors, votingDeadline: '' });
                                            }
                                        }}
                                        className={`w-full ${validationErrors.votingDeadline ? 'border-red-500 focus:border-red-500' : ''}`}
                                    />
                                    {validationErrors.votingDeadline && (
                                        <p className="text-sm text-red-500 mt-1">{validationErrors.votingDeadline}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="minParticipation" className="block text-sm font-medium mb-2">Minimum participation (%) *</Label>
                                    <Input
                                        id="minParticipation"
                                        value={formData.minParticipation}
                                        onChange={(e) => {
                                            setFormData({ ...formData, minParticipation: e.target.value });
                                            if (validationErrors.minParticipation) {
                                                setValidationErrors({ ...validationErrors, minParticipation: '' });
                                            }
                                        }}
                                        className={`w-full ${validationErrors.minParticipation ? 'border-red-500 focus:border-red-500' : ''}`}
                                        placeholder="e.g., 60%"
                                    />
                                    {validationErrors.minParticipation && (
                                        <p className="text-sm text-red-500 mt-1">{validationErrors.minParticipation}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="minApproval" className="block text-sm font-medium mb-2">Minimum of approval *</Label>
                                    <Input
                                        id="minApproval"
                                        value={formData.minApproval}
                                        onChange={(e) => {
                                            setFormData({ ...formData, minApproval: e.target.value });
                                            if (validationErrors.minApproval) {
                                                setValidationErrors({ ...validationErrors, minApproval: '' });
                                            }
                                        }}
                                        className={`w-full ${validationErrors.minApproval ? 'border-red-500 focus:border-red-500' : ''}`}
                                        placeholder="e.g., 16 members"
                                    />
                                    {validationErrors.minApproval && (
                                        <p className="text-sm text-red-500 mt-1">{validationErrors.minApproval}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="grid grid-cols-2 gap-8">
                                <Card>
                                    <CardContent className="p-6">
                                        <h3 className="text-xl font-bold mb-4">{formData.title}</h3>
                                        <p className="text-gray-600 mb-4">{formData.description}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Proposal Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Proposal Type</span>
                                            <span className="font-medium">{formData.proposalType}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Voting Deadline</span>
                                            <span className="font-medium">{formData.votingDeadline}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Requested Funding Amounts</span>
                                            <span className="font-medium">{formData.fundingAmount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Minimum Participation</span>
                                            <span className="font-medium">{formData.minParticipation} (20 members)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Minimum of Approval</span>
                                            <span className="font-medium">{formData.minApproval}</span>
                                        </div>

                                        <div className="pt-4 border-t">
                                            <h4 className="font-medium mb-2">Actions</h4>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Request funds to</span>
                                                <span className="text-blue-600 font-medium">
                                                    Your Account
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 font-mono">
                                                {currentAccount ? 
                                                    `${currentAccount.principal.toString().slice(0, 8)}...${currentAccount.principal.toString().slice(-8)}` : 
                                                    'Not connected'
                                                }
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </motion.div>

                    {/* Navigation Buttons */}
                    <div className="mt-8">
                        {currentStep === 1 ? (
                            <div className="w-full flex justify-end">
                                <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 px-8">
                                    Next Step
                                </Button>
                            </div>
                        ) : currentStep === 2 ? (
                            <div className="flex justify-between items-center">
                                <Button variant="outline" onClick={handleBack} className="px-8">
                                    Back
                                </Button>
                                <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700 px-8">
                                    Next Step
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Row 1: Back button stretched */}
                                <div className="w-full">
                                    <Button variant="outline" onClick={handleBack} className="w-full">
                                        Back
                                    </Button>
                                </div>
                                {/* Row 2: Save Draft and Publish buttons */}
                                <div className="flex space-x-4 w-full">
                                    <Button 
                                        variant="outline" 
                                        onClick={handleSaveDraft}
                                        className="flex-1 bg-blue-600 text-white hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                                    >
                                        Save as Draft
                                    </Button>
                                    <Button 
                                        onClick={handlePublish} 
                                        className="flex-1 bg-slate-900 hover:bg-slate-800"
                                    >
                                        Publish
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                    >
                        <h3 className="text-lg font-semibold mb-2">Confirmation</h3>
                        <p className="text-gray-600 mb-4">Are you sure to publish?</p>
                        <p className="text-sm text-gray-500 mb-6">
                            After publishing, the changes on this proposal cannot be edit later.
                        </p>
                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={() => setShowConfirmation(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={confirmPublish} className="flex-1 bg-slate-900 hover:bg-slate-800">
                                Publish
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    )
}

export default ProposalCreation