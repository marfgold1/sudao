import { DAOLayout } from "@/components/DAOLayout"
import { useDAO } from "@/hooks/useDAO"
import { formatTime, iterLinkList, keyVariant, matchVariant } from "@/utils/converter"

export const DAOHomeTest = () => {
    return (
        <DAOLayout>
            <Content />
        </DAOLayout>
    )
}

const Content = () => {
    const { daoInfo, deploymentInfo, isLoading, error, refetch } = useDAO();
    return (
        <div>
            {isLoading && <div>Loading...</div>}
            {error && <div>Error: {error}</div>}
            {daoInfo && (
                <div>
                    <h1>DAO Info</h1>
                    <table className="min-w-full border border-gray-200 rounded">
                        <tbody>
                            {Object.entries({
                                "ID": daoInfo.id,
                                "Name": daoInfo.name,
                                "Description": daoInfo.description,
                                "Tags": daoInfo.tags.join(', '),
                                "Created At": formatTime(daoInfo.createdAt),
                                "Creator": daoInfo.creator.toString(),
                            }).map(([key, value]) => (
                                <tr>
                                    <td className="font-semibold px-4 py-2 border-b">{key}</td>
                                    <td className="px-4 py-2 border-b">{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {deploymentInfo && (
                <div>
                    <h1>Deployment Info</h1>
                    <table className="min-w-full border border-gray-200 rounded">
                        <tbody>
                            {Object.entries({
                                "Status": matchVariant(deploymentInfo.status, {
                                    deployed: (val) => `Deployed at ${formatTime(val.deployedAt)}`,
                                    deploying: (val) => `Deployment started at ${formatTime(val.startedAt)} and currently in step: ${matchVariant(val.step, {
                                        creating_canister: (v) => `creating canister ${keyVariant(v)}`,
                                        installing_code: (v) => `installing code ${keyVariant(v)}`,
                                    })}`,
                                    failed: (val) => `Deployment failed at ${formatTime(val.failedAt)} with error: ${val.errorMessage}`,
                                    queued: () => "Deployment queued",
                                }),
                                "Created At": formatTime(deploymentInfo.createdAt),
                                "Canister IDs": Array.from(iterLinkList(deploymentInfo.canisterIds)).map(([codeType, canisterId]) => `${keyVariant(codeType)}: ${canisterId.toString()}`).join(', '),
                            }).map(([key, value]) => (
                                <tr>
                                    <td className="font-semibold px-4 py-2 border-b">{key}</td>
                                    <td className="px-4 py-2 border-b">{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )
            }
            <button onClick={refetch}>Refetch</button>
        </div >
    )
}
