"use client";

import type { MutableRefObject } from "react";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { useDraftSession } from "@/hooks/useDraftSession";
import {
	getOrdersQueryKey,
	ORDER_STAGES,
	queryClient,
} from "@/lib/queryClient";
import type { OrderStage } from "@/services/orderService";
import { useAppStore } from "@/store/useStore";
import type { PendingRow } from "@/types";

const RECOVERY_STORAGE_KEY = "pending-sys-draft-v1";

type StageRows = Record<OrderStage, PendingRow[]>;

type SaveOrderVars = {
	id: string;
	sourceStage?: OrderStage;
	stage: OrderStage;
	updates: Partial<PendingRow>;
};

type BulkUpdateStageVars = {
	ids: string[];
	stage: OrderStage;
};

function createRow(
	id: string,
	stage: OrderStage,
	overrides: Partial<PendingRow> = {},
): PendingRow {
	return {
		id,
		baseId: id.slice(-6),
		trackingId: `ORD-${id.slice(-6)}`,
		customerName: "Recovery Test",
		company: "Renault",
		vin: `VF1RFA000000${id.slice(-4)}`,
		mobile: "01000000000",
		cntrRdg: 42000,
		model: "Megane",
		parts: [
			{
				id: `part-${id}`,
				partNumber: "PN-001",
				description: "Brake pad",
			},
		],
		sabNumber: "SAB-001",
		acceptedBy: "Agent",
		requester: "Branch",
		partNumber: "PN-001",
		description: "Brake pad",
		status: "Pending",
		rDate: "2026-03-23",
		repairSystem: "Cash",
		startWarranty: "",
		endWarranty: "",
		remainTime: "",
		attachmentLink: "https://example.com/spec-sheet",
		hasAttachment: true,
		stage,
		...overrides,
	};
}

const INITIAL_SERVER_STATE: StageRows = {
	orders: [createRow("00000000-0000-4000-8000-000000000011", "orders")],
	main: [createRow("00000000-0000-4000-8000-000000000012", "main")],
	call: [],
	booking: [],
	archive: [],
};

function cloneStageRows(rowsByStage: StageRows): StageRows {
	return structuredClone(rowsByStage);
}

function seedStageRows(rowsByStage: StageRows) {
	for (const stage of ORDER_STAGES) {
		queryClient.setQueryData(
			getOrdersQueryKey(stage),
			structuredClone(rowsByStage[stage]),
		);
	}
}

function findRow(rowsByStage: StageRows, id: string) {
	for (const stage of ORDER_STAGES) {
		const index = rowsByStage[stage].findIndex((row) => row.id === id);
		if (index >= 0) {
			return {
				stage,
				index,
				row: rowsByStage[stage][index],
			};
		}
	}

	return null;
}

function useCachedStageRows(stage: OrderStage) {
	return useSyncExternalStore(
		useCallback(
			(onStoreChange) =>
				queryClient.getQueryCache().subscribe(() => onStoreChange()),
			[],
		),
		() =>
			queryClient.getQueryData<PendingRow[]>(getOrdersQueryKey(stage)) ?? [],
		() => [],
	);
}

function DraftSessionRecoveryHarnessInner({
	serverStateRef,
}: {
	serverStateRef: MutableRefObject<StageRows>;
}) {
	const {
		applyCommand,
		canRedo,
		canUndo,
		dirty,
		discardDraft,
		pendingCommandCount,
		saveError,
		saving,
	} = useDraftSession("orders");
	const draftSession = useAppStore((state) => state.draftSession);
	const getWorkingRows = useAppStore((state) => state.getWorkingRows);
	const saveDraft = useAppStore((state) => state.saveDraft);
	const failNextSaveRef = useRef(false);
	const saveCounterRef = useRef(0);

	const cachedOrders = useCachedStageRows("orders");
	const cachedMain = useCachedStageRows("main");
	const cachedCall = useCachedStageRows("call");
	const cachedBooking = useCachedStageRows("booking");
	const cachedArchive = useCachedStageRows("archive");

	const rowsByStage = useMemo(
		() => ({
			orders: getWorkingRows("orders") ?? cachedOrders,
			main: getWorkingRows("main") ?? cachedMain,
			call: getWorkingRows("call") ?? cachedCall,
			booking: getWorkingRows("booking") ?? cachedBooking,
			archive: getWorkingRows("archive") ?? cachedArchive,
		}),
		[
			cachedArchive,
			cachedBooking,
			cachedCall,
			cachedMain,
			cachedOrders,
			draftSession.isActive,
			draftSession.pendingCommands.length,
			getWorkingRows,
		],
	);

	const updateServerState = useCallback(
		(mutator: (rowsByStage: StageRows) => void) => {
			const nextState = cloneStageRows(serverStateRef.current);
			mutator(nextState);
			serverStateRef.current = nextState;
			seedStageRows(nextState);
		},
		[serverStateRef],
	);

	const maybeFailSave = useCallback(() => {
		if (!failNextSaveRef.current) {
			return;
		}

		failNextSaveRef.current = false;
		throw new Error("Draft save failed");
	}, []);

	const applySampleCommands = useCallback(() => {
		const ordersRow = serverStateRef.current.orders[0];
		const mainRow = serverStateRef.current.main[0];

		applyCommand({
			type: "patchRow",
			id: ordersRow.id,
			sourceStage: "orders",
			destinationStage: "orders",
			updates: {
				status: "Arrived",
			},
			previousValues: {
				status: ordersRow.status,
			},
		});
		applyCommand({
			type: "moveRows",
			ids: [ordersRow.id],
			sourceStage: "orders",
			destinationStage: "main",
		});
		applyCommand({
			type: "patchRow",
			id: mainRow.id,
			sourceStage: "main",
			destinationStage: "booking",
			updates: {
				bookingDate: "2026-03-24",
				bookingNote: "Recovery smoke test",
				bookingStatus: "Scheduled",
			},
			previousValues: {},
		});
	}, [applyCommand, serverStateRef]);

	const handleSave = useCallback(async () => {
		await saveDraft({
			saveOrder: async (vars: SaveOrderVars) => {
				const { id, sourceStage, stage, updates } = vars;
				maybeFailSave();

				updateServerState((nextState) => {
					const existing = id ? findRow(nextState, id) : null;

					if (existing) {
						const updatedRow: PendingRow = {
							...existing.row,
							...updates,
							stage,
						};

						nextState[existing.stage].splice(existing.index, 1);
						nextState[stage] = [
							updatedRow,
							...nextState[stage].filter((row) => row.id !== updatedRow.id),
						];
						return;
					}

					const nextId = `saved-${++saveCounterRef.current}`;
					const newRow: PendingRow = {
						...createRow(nextId, stage),
						...(updates as PendingRow),
						id: nextId,
						stage,
					};

					if (sourceStage && sourceStage !== stage) {
						nextState[sourceStage] = nextState[sourceStage].filter(
							(row) => row.id !== nextId,
						);
					}

					nextState[stage] = [
						newRow,
						...nextState[stage].filter((row) => row.id !== newRow.id),
					];
				});
			},
			bulkUpdateStage: async (vars: BulkUpdateStageVars) => {
				const { ids, stage } = vars;
				maybeFailSave();

				updateServerState((nextState) => {
					const idSet = new Set(ids);
					const movedRows: PendingRow[] = [];

					for (const currentStage of ORDER_STAGES) {
						const remainingRows: PendingRow[] = [];

						for (const row of nextState[currentStage]) {
							if (!idSet.has(row.id)) {
								remainingRows.push(row);
								continue;
							}

							movedRows.push({
								...row,
								stage,
							});
						}

						nextState[currentStage] = remainingRows;
					}

					nextState[stage] = [...movedRows, ...nextState[stage]];
				});
			},
			bulkDelete: async (ids: string[]) => {
				maybeFailSave();

				updateServerState((nextState) => {
					const idSet = new Set(ids);

					for (const stage of ORDER_STAGES) {
						nextState[stage] = nextState[stage].filter(
							(row) => !idSet.has(row.id),
						);
					}
				});
			},
		});
	}, [maybeFailSave, saveDraft, updateServerState]);

	const handleReset = useCallback(() => {
		serverStateRef.current = cloneStageRows(INITIAL_SERVER_STATE);
		seedStageRows(serverStateRef.current);
		discardDraft();
	}, [discardDraft, serverStateRef]);

	return (
		<div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
			<header className="space-y-2">
				<p className="text-xs uppercase tracking-[0.3em] text-slate-400">
					Draft Session Harness
				</p>
				<h1 className="text-3xl font-semibold text-white">
					Recovery flow browser test surface
				</h1>
				<p className="max-w-2xl text-sm text-slate-300">
					This route seeds deterministic stage data and exposes draft-session
					state for Playwright recovery coverage.
				</p>
			</header>

			<section className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-5 text-sm text-slate-200 md:grid-cols-4">
				<div>
					<p className="text-slate-400">Dirty</p>
					<p data-testid="draft-dirty">{String(dirty)}</p>
				</div>
				<div>
					<p className="text-slate-400">Saving</p>
					<p data-testid="draft-saving">{String(saving)}</p>
				</div>
				<div>
					<p className="text-slate-400">Pending commands</p>
					<p data-testid="pending-count">{pendingCommandCount}</p>
				</div>
				<div>
					<p className="text-slate-400">Recovery snapshot</p>
					<p data-testid="recovery-snapshot-present">
						{String(Boolean(localStorage.getItem(RECOVERY_STORAGE_KEY)))}
					</p>
				</div>
				<div>
					<p className="text-slate-400">Undo enabled</p>
					<p data-testid="can-undo">{String(canUndo)}</p>
				</div>
				<div>
					<p className="text-slate-400">Redo enabled</p>
					<p data-testid="can-redo">{String(canRedo)}</p>
				</div>
				<div>
					<p className="text-slate-400">Past count</p>
					<p data-testid="past-count">{draftSession.past.length}</p>
				</div>
				<div>
					<p className="text-slate-400">Future count</p>
					<p data-testid="future-count">{draftSession.future.length}</p>
				</div>
				<div className="md:col-span-4">
					<p className="text-slate-400">Save error</p>
					<p data-testid="save-error">{saveError ?? "none"}</p>
				</div>
			</section>

			<section className="flex flex-wrap gap-3">
				<button
					type="button"
					data-testid="apply-sample-commands"
					onClick={applySampleCommands}
					className="rounded-full bg-amber-400 px-4 py-2 text-sm font-medium text-slate-950"
				>
					Apply 3 sample commands
				</button>
				<button
					type="button"
					data-testid="queue-save-failure"
					onClick={() => {
						failNextSaveRef.current = true;
					}}
					className="rounded-full border border-red-400/50 px-4 py-2 text-sm font-medium text-red-200"
				>
					Fail next save
				</button>
				<button
					type="button"
					data-testid="save-draft"
					onClick={() => {
						void handleSave();
					}}
					className="rounded-full border border-emerald-400/40 px-4 py-2 text-sm font-medium text-emerald-200"
				>
					Save draft
				</button>
				<button
					type="button"
					data-testid="reset-harness"
					onClick={handleReset}
					className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-slate-200"
				>
					Reset harness
				</button>
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{ORDER_STAGES.map((stage) => (
					<article
						key={stage}
						className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
					>
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-medium capitalize text-white">
								{stage}
							</h2>
							<span
								data-testid={`stage-${stage}-count`}
								className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-300"
							>
								{rowsByStage[stage].length}
							</span>
						</div>
						<p
							data-testid={`stage-${stage}-rows`}
							className="mt-3 whitespace-pre-wrap text-xs text-slate-300"
						>
							{rowsByStage[stage].length === 0
								? "empty"
								: rowsByStage[stage]
										.map((row) =>
											[
												row.trackingId,
												row.stage,
												row.status,
												row.bookingStatus ?? "",
											]
												.filter(Boolean)
												.join(" | "),
										)
										.join("\n")}
						</p>
					</article>
				))}
			</section>
		</div>
	);
}

export function DraftSessionRecoveryHarness() {
	const [ready, setReady] = useState(false);
	const serverStateRef = useRef<StageRows>(
		cloneStageRows(INITIAL_SERVER_STATE),
	);

	useEffect(() => {
		queryClient.clear();
		serverStateRef.current = cloneStageRows(INITIAL_SERVER_STATE);
		seedStageRows(serverStateRef.current);
		setReady(true);
	}, []);

	if (!ready) {
		return (
			<div className="flex min-h-screen items-center justify-center text-sm text-slate-300">
				<span data-testid="harness-loading">Loading harness...</span>
			</div>
		);
	}

	return <DraftSessionRecoveryHarnessInner serverStateRef={serverStateRef} />;
}
