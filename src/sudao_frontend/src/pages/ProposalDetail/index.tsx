import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Proposal } from "@/types"
import { motion } from "framer-motion"
import { AlertTriangle, ArrowLeft, Calendar, Eye, MessageCircle, ChevronDown, ChevronUp, Edit, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"

interface Comment {
    id: number;
    author: string;
    avatar: string;
    date: string;
    content: string;
    reactions: { [emoji: string]: number };
    userReactions: string[];
}

const ProposalDetail: React.FC<{ proposal: Proposal, onBack: any, onEdit?: (proposal: Proposal) => void, onPublish?: (proposal: Proposal) => void }> = ({ proposal, onBack, onEdit, onPublish }) => {
    const [vote, setVote] = useState<"support" | "against" | null>(null)
    const [comment, setComment] = useState("")
    const [showComments, setShowComments] = useState(true)
    const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null)
    const [hasVoted, setHasVoted] = useState(false)
    const [voteResults, setVoteResults] = useState({
        support: 60,
        against: 30,
        totalVotes: proposal.votes
    })
    // Initialize comments based on proposal - new projects start with 0 comments
    const [comments, setComments] = useState<Comment[]>(() => {
        // For new proposals (created through the form), start with empty array
        if (proposal.id.startsWith('draft-') || proposal.id.startsWith('proposal-')) {
            return [];
        }
        
        // Default comments for existing mock proposals
        return [
            {
                id: 1,
                author: "Charles Neine",
                avatar: "CN",
                date: "June 25, 2025",
                content: "I think that this is a fine proposal. Not sure about the numbers of the fishermen though since it got quite expensive recently...",
                reactions: { "👍": 298, "👎": 48, "❤️": 12, "😊": 5, "😢": 2 },
                userReactions: []
            },
            {
                id: 2,
                author: "Samuel Samantha",
                avatar: "SS",
                date: "June 25, 2025",
                content: "Not going to agree with this. Do better.",
                reactions: { "👍": 320, "👎": 0, "❤️": 8, "😊": 15, "😢": 3 },
                userReactions: []
            },
        ];
    })

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showEmojiPicker !== null) {
                const target = event.target as Element;
                if (!target.closest('.emoji-picker-container')) {
                    setShowEmojiPicker(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    const handleAddComment = () => {
        if (comment.trim()) {
            const newComment: Comment = {
                id: comments.length + 1,
                author: "Current User",
                avatar: "CU",
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                content: comment,
                reactions: { "👍": 0, "👎": 0, "❤️": 0, "😊": 0, "😢": 0 },
                userReactions: []
            };
            setComments([...comments, newComment]);
            setComment("");
        }
    };

    const handleReaction = (commentId: number, emoji: string) => {
        setComments(prevComments => 
            prevComments.map(comment => {
                if (comment.id === commentId) {
                    const hasReacted = comment.userReactions.includes(emoji);
                    const newUserReactions = hasReacted 
                        ? comment.userReactions.filter(r => r !== emoji)
                        : [...comment.userReactions, emoji];
                    
                    const newReactions = { ...comment.reactions };
                    if (hasReacted) {
                        newReactions[emoji] = Math.max(0, newReactions[emoji] - 1);
                    } else {
                        newReactions[emoji] = (newReactions[emoji] || 0) + 1;
                    }
                    
                    return {
                        ...comment,
                        reactions: newReactions,
                        userReactions: newUserReactions
                    };
                }
                return comment;
            })
        );
        // Close emoji picker after selection
        setShowEmojiPicker(null);
    };

    const availableEmojis = ["👍", "👎", "❤️", "😊", "😢"];

    const handleVote = (voteType: "support" | "against") => {
        if (!hasVoted) {
            setVote(voteType);
            setHasVoted(true);
            
            // Update vote results
            setVoteResults(prev => {
                const newTotalVotes = prev.totalVotes + 1;
                let newSupport = prev.support;
                let newAgainst = prev.against;
                
                if (voteType === "support") {
                    // Recalculate percentages with new vote
                    newSupport = Math.round(((prev.support * prev.totalVotes / 100) + 1) / newTotalVotes * 100);
                    newAgainst = Math.round((prev.against * prev.totalVotes / 100) / newTotalVotes * 100);
                } else {
                    // Recalculate percentages with new vote
                    newSupport = Math.round((prev.support * prev.totalVotes / 100) / newTotalVotes * 100);
                    newAgainst = Math.round(((prev.against * prev.totalVotes / 100) + 1) / newTotalVotes * 100);
                }
                
                return {
                    support: newSupport,
                    against: newAgainst,
                    totalVotes: newTotalVotes
                };
            });
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <main className="container mx-auto px-6">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-3 mb-6">
                    <ArrowLeft onClick={onBack} className="cursor-pointer w-4 h-4 mr-2" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink onClick={onBack} className="cursor-pointer hover:text-blue-600">
                                    Proposals
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="max-w-[300px] truncate">{proposal.title}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <Badge variant={proposal.status}>{proposal.status}</Badge>
                </div>

                {/* Author Info */}
                <div className="flex items-center justify-between mb-10 text-sm text-gray-600">
                    <div className="flex items-center space-x-10">
                        {proposal.status === 'Draft' ? (
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-3xl flex justify-center items-center">
                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p>Last edited</p>
                                    <p className="font-medium">{proposal.publishedDate}</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center space-x-3">
                                    <Avatar className="w-10 h-10 bg-blue-50 text-blue-600 dark:text-blue-400">
                                        <AvatarFallback>CN</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p>Published by</p>
                                        <p className="font-medium">{proposal.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-3xl flex justify-center items-center">
                                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p>Published in</p>
                                        <p className="font-medium">{proposal.publishedDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-3xl flex justify-center items-center">
                                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p>Last edited</p>
                                        <p className="font-medium">{proposal.publishedDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-3xl flex justify-center items-center">
                                        <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p>Viewed by</p>
                                        <p className="font-medium">3 Members</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* Edit and Publish buttons for Draft status */}
                    {proposal.status === 'Draft' && (onEdit || onPublish) && (
                        <div className="flex items-center space-x-3">
                            {onEdit && (
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => onEdit(proposal)}
                                    className="flex items-center gap-2 px-6"
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                            )}
                            {onPublish && (
                                <Button
                                    size="lg"
                                    onClick={() => onPublish(proposal)}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-16"
                                >
                                    <FileText className="w-4 h-4" />
                                    Publish
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="col-span-2">
                        <Card>
                            <CardContent className="p-6">
                            <h1 className="text-2xl font-bold mb-4">{proposal.title}</h1>
                            <div className="prose max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {proposal.description}
                                </p>
                            </div>
                            </CardContent>
                        </Card>

                        {/* Comments Section Toggle - Hidden for Draft proposals */}
                        {proposal.status !== 'Draft' && (
                            <div className="mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowComments(!showComments)}
                                    className="mb-4 flex items-center gap-2"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    {showComments ? 'Hide' : 'Show'} Comments ({comments.length})
                                    {showComments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </Button>
                            
                            {showComments && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Card>
                                        <CardContent className="p-6">
                                            {/* Add Comment Form */}
                                            <div className="mb-10">
                                                <Textarea
                                                    placeholder="Type out a comment...."
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    className="mb-3 resize-none"
                                                    rows={3}
                                                />
                                                <Button 
                                                    onClick={handleAddComment}
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                    disabled={!comment.trim()}
                                                >
                                                    Comment
                                                </Button>
                                            </div>

                                            {/* Comments List */}
                                            <div className="space-y-6">
                                                {comments.map((commentItem) => (
                                                    <div key={commentItem.id} className="border-b pb-6 last:border-b-0">
                                                        <div className="flex items-start space-x-3">
                                                            <Avatar>
                                                                <AvatarFallback className={commentItem.author === 'Current User' ? 'bg-blue-100 text-blue-600' : ''}>
                                                                    {commentItem.avatar}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h4 className="font-medium">{commentItem.author}</h4>
                                                                    <span className="text-sm text-gray-500">{commentItem.date}</span>
                                                                </div>
                                                                <p className="text-gray-700 dark:text-gray-300 mb-3">{commentItem.content}</p>
                                                                
                                                                {/* Emoji Reactions */}
                                                                <div className="flex items-center">
                                                                    <div className="flex items-center space-x-2">
                                                                        {Object.entries(commentItem.reactions).map(([emoji, count]) => (
                                                                            count > 0 && (
                                                                                <button
                                                                                    key={emoji}
                                                                                    onClick={() => handleReaction(commentItem.id, emoji)}
                                                                                    className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                                                                                        commentItem.userReactions.includes(emoji)
                                                                                            ? 'bg-blue-100 text-blue-600 border border-blue-200'
                                                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                                    }`}
                                                                                >
                                                                                    <span>{emoji}</span>
                                                                                    <span>{count}</span>
                                                                                </button>
                                                                            )
                                                                        ))}
                                                                    </div>
                                                                    
                                                                    {/* Add Reaction Button */}
                                                                    <div className="relative emoji-picker-container">
                                                                        <button
                                                                            onClick={() => setShowEmojiPicker(showEmojiPicker === commentItem.id ? null : commentItem.id)}
                                                                            className="p-0.5 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                                            title="Add reaction"
                                                                        >
                                                                            + 
                                                                        </button>
                                                                        
                                                                        {/* Emoji Picker Dropdown */}
                                                                        {showEmojiPicker === commentItem.id && (
                                                                            <motion.div
                                                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                                className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-20"
                                                                            >
                                                                                <div className="flex items-center space-x-1">
                                                                                    {availableEmojis.map((emoji) => (
                                                                                        <button
                                                                                            key={emoji}
                                                                                            onClick={() => handleReaction(commentItem.id, emoji)}
                                                                                            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-lg transition-colors ${
                                                                                                commentItem.userReactions.includes(emoji) 
                                                                                                    ? 'bg-blue-100 dark:bg-blue-900/50 ring-1 ring-blue-200 dark:ring-blue-700' 
                                                                                                    : ''
                                                                                            }`}
                                                                                            title={`React with ${emoji}`}
                                                                                        >
                                                                                            {emoji}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Voting Section - Hidden for Draft proposals */}
                        {proposal.status !== 'Draft' && (hasVoted || proposal.status === "Approved") ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        {hasVoted ? "Your Vote Submitted" : "Ongoing Voting Results"}
                                    </CardTitle>
                                    <CardDescription>Votes open until {proposal.deadline}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {hasVoted && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                                <p className="text-sm text-green-700 font-medium">
                                                    ✓ You voted: {vote === "support" ? "Support" : "Against"}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm font-medium text-green-600">{voteResults.support}% Support</span>
                                                <span className="text-xs text-gray-500">
                                                    {Math.round(voteResults.support * voteResults.totalVotes / 100)} votes
                                                </span>
                                            </div>
                                            <Progress value={voteResults.support} className="h-3" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm font-medium text-red-600">{voteResults.against}% Against</span>
                                                <span className="text-xs text-gray-500">
                                                    {Math.round(voteResults.against * voteResults.totalVotes / 100)} votes
                                                </span>
                                            </div>
                                            <Progress value={voteResults.against} className="h-3" />
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-sm text-gray-600">{voteResults.totalVotes} members voted</span>
                                            <div className="flex space-x-2">
                                                {voteResults.totalVotes >= 20 && (
                                                    <Badge variant="Approved">Quorum Reached</Badge>
                                                )}
                                                {voteResults.support >= 60 && (
                                                    <Badge variant="Approved">Approval Reached</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : proposal.status !== 'Draft' ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Voting</CardTitle>
                                    <CardDescription>Votes open until {proposal.deadline}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <Button 
                                            className="w-full bg-blue-600 hover:bg-blue-700" 
                                            onClick={() => handleVote("support")}
                                            disabled={hasVoted}
                                        >
                                            Support
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            className="w-full bg-transparent" 
                                            onClick={() => handleVote("against")}
                                            disabled={hasVoted}
                                        >
                                            Against
                                        </Button>
                                        <p className="text-sm text-gray-600">{voteResults.totalVotes} members voted</p>
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex space-x-3 items-center">
                                            <AlertTriangle className="text-red-700" />
                                            <p className="text-sm text-red-700">
                                                Please review your choice carefully before submitting. You cannot change your votes.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}

                        {/* Proposal Details */}
                        <Card>
                            <CardHeader className="pb-3 pt-4">
                                <CardTitle className="text-lg">Proposal Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Voting Deadline</span>
                                    <span className="font-medium">{proposal.deadline}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Requested Funding Amounts</span>
                                    <span className="font-medium">{proposal.fundingAmount} ICP</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Minimum Participation</span>
                                    <span className="font-medium">20% (20 members)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Minimum of Approval</span>
                                    <span className="font-medium">16 members</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card>
                            <CardHeader className="pb-2 pt-4">
                                <CardTitle className="text-lg">Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <div>
                                            <span className="text-gray-600">Request funds to</span>
                                        </div>
                                        <div>
                                            <Link className="text-blue-600 hover:underline font-medium" to={"#"}>
                                                Michael Lewellen
                                            </Link>
                                            <p className="text-sm text-gray-500">rwlgt-iia...aai-aaa</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </motion.div>
    )
}

export default ProposalDetail