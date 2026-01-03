"use client";

import { History, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useStore";
import type { CommitLog } from "@/types";

export const HistoryTab = () => {
	const commits = useAppStore((state) => state.commits);

	return (
		<div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="space-y-0 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
				{commits.length === 0 ? (
					<div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
						<History className="h-10 w-10 text-gray-700 mb-4" />
						<p className="text-gray-500 text-sm">
							No activity recorded for this session.
						</p>
					</div>
				) : (
					[...commits].reverse().map((commit, index) => {
						const isLatest = index === 0;
						const date = new Date(commit.timestamp);
						const timeString = date.toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						});
						const dateString = date.toLocaleDateString([], {
							month: "2-digit",
							day: "2-digit",
							year: "numeric",
						});

						return (
							<div
								key={commit.id}
								className="relative pl-12 pb-10 last:pb-0 group"
							>
								{/* Timeline Dot */}
								<div
									className={cn(
										"absolute left-[13px] top-1.5 w-[10px] h-[10px] rounded-full border-2 border-[#1c1c1e] z-10 transition-all duration-300",
										isLatest
											? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
											: "bg-gray-700 group-hover:bg-indigo-400",
									)}
								/>

								{/* Card */}
								<div
									className={cn(
										"p-5 rounded-2xl border transition-all duration-300",
										isLatest
											? "bg-emerald-500/5 border-emerald-500/20"
											: "bg-white/5 border-transparent hover:border-white/10 hover:bg-white/[0.07]",
									)}
								>
									<div className="flex items-start justify-between gap-4">
										<div className="space-y-1">
											<div className="flex items-center gap-3">
												<h5 className="font-semibold text-gray-200">
													{commit.actionName}
												</h5>
												{isLatest && (
													<span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-500 tracking-wider">
														LATEST
													</span>
												)}
											</div>
											<div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
												<span>{timeString}</span>
												<span className="w-1 h-1 rounded-full bg-gray-700" />
												<span>{dateString}</span>
											</div>
										</div>

										{!isLatest && (
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													useAppStore.getState().restoreToCommit(commit.id)
												}
												className="h-8 rounded-xl border-white/10 hover:bg-indigo-500/10 hover:text-indigo-400 hover:border-indigo-400/30 transition-all"
											>
												<Undo2 className="h-3.5 w-3.5 mr-2" />
												Restore
											</Button>
										)}
									</div>
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
};
