import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Eye, UserPlus } from "lucide-react"
import { Link } from "react-router-dom"

interface Collective {
    id: string
    name: string
    description: string
    avatar: string
    members: number
    tags: string[]
    category?: string
    deploymentStatus?: { Pending: null } | { Deploying: null } | { Deployed: { canisterId: string } } | { Failed: { error: string } }
}

interface CollectiveCardProps {
    collective: Collective
    index: number
    isOwned: boolean
}

export default function CollectiveCard({ collective, index, isOwned }: CollectiveCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={collective.avatar || "/placeholder.svg"} alt={collective.name} />
                                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                                {collective.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="flex items-center">
                            <div className="*:data-[slot=avatar]:ring-background flex items-center bg-slate-100 rounded-3xl py-1 px-2 pr-4 -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                                    <AvatarFallback>CN</AvatarFallback>
                                </Avatar>
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src="https://github.com/leerob.png" alt="@leerob" />
                                    <AvatarFallback>LR</AvatarFallback>
                                </Avatar>
                                <Avatar className="w-8 h-8">
                                    <AvatarImage
                                        src="https://github.com/evilrabbit.png"
                                        alt="@evilrabbit"
                                    />
                                    <AvatarFallback>ER</AvatarFallback>
                                </Avatar>
                                <div className="font-medium text-sm text-blue-600 pl-4">+{collective.members}</div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="pt-4">
                    <CardTitle className="text-lg font-semibold text-slate-900 leading-tight">{collective.name}</CardTitle>
                    <CardDescription className="text-sm text-slate-600 mb-4 mt-2 line-clamp-3 leading-relaxed">
                        {collective.description}
                    </CardDescription>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {collective.tags.map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                            {tag}
                        </Badge>
                        ))}
                    </div>

                    {/* Deployment Status */}
                    {collective.deploymentStatus && (
                        <div className="mb-3">
                            {'Pending' in collective.deploymentStatus && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Deployment</Badge>
                            )}
                            {'Deploying' in collective.deploymentStatus && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Deploying...</Badge>
                            )}
                            {'Deployed' in collective.deploymentStatus && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">Deployed</Badge>
                            )}
                            {'Failed' in collective.deploymentStatus && (
                                <Badge variant="secondary" className="bg-red-100 text-red-800">Deployment Failed</Badge>
                            )}
                        </div>
                    )}

                    <div className="flex space-x-2 mt-12 justify-end">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link to={`/dao/${collective.id}/home`}>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 border-slate-200 hover:bg-slate-50 bg-transparent"
                                    disabled={collective.deploymentStatus && !('Deployed' in collective.deploymentStatus)}
                                >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                                </Button>
                            </Link>
                        </motion.div>
                        {!isOwned && (
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Link to={`/home/${collective.id}`}>
                                    <Button 
                                        size="sm" 
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                        disabled={collective.deploymentStatus && !('Deployed' in collective.deploymentStatus)}
                                    >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Join
                                    </Button>
                                </Link>
                            </motion.div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
