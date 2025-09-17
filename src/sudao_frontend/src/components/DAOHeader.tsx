import { DAOInfo } from "declarations/sudao_backend/sudao_backend.did";
import React from "react"
import { Badge } from "@/components/ui/badge";

interface DAOHeaderProps {
    dao: DAOInfo;
    isCreator: boolean;
}

const DAOHeader: React.FC<DAOHeaderProps> = ({
    dao, isCreator
}) => {
    return (
        <div className="mb-8">
            {/* DAO Header */}
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{dao?.name || "Loading..."}</h1>
                {isCreator && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Creator
                    </Badge>
                )}
            </div>
            <p className="text-gray-600 mb-4 max-w-2xl">{dao?.description || "Loading DAO description..."}</p>
            {dao?.tags && dao.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {dao.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">{tag}</Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DAOHeader;