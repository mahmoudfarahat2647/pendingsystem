"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	AlertCircle,
	CheckCircle2,
	ChevronsUpDown,
	ClipboardList,
	FileSpreadsheet,
	MapPin,
	Package,
	Pencil,
	Plus,
	User,
	X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { EditableSelect } from "@/components/shared/EditableSelect";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleDatePicker } from "@/components/ui/simple-date-picker";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	calculateEndWarranty,
	calculateRemainingTime,
	cn,
	detectModelFromVin,
	generateId,
} from "@/lib/utils";
import { BeastModeSchema, OrderFormSchema } from "@/schemas/form.schema";
import { useAppStore } from "@/store/useStore";
import type { PartEntry, PendingRow } from "@/types";

export interface FormData {
	customerName: string;
	vin: string;
	mobile: string;
	cntrRdg: string;
	model: string;
	repairSystem: string;
	startWarranty: string;
	requester: string;
	sabNumber: string;
	acceptedBy: string;
	company: string;
}

interface OrderFormModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isEditMode: boolean;
	selectedRows: PendingRow[];
	onSubmit: (formData: FormData, parts: PartEntry[]) => void;
}

interface ValidationRow {
	vin?: string | null;
	partNumber?: string | null;
	id?: string;
	description?: string;
}

interface ValidationList {
	name: string;
	rows: ValidationRow[];
}

interface PartValidationWarning {
	type: "mismatch" | "duplicate";
	value: string;
	location?: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;
type PartValidationWarnings = Record<string, PartValidationWarning>;

const createDefaultFormData = (): FormData => ({
	customerName: "",
	vin: "",
	mobile: "",
	cntrRdg: "",
	model: "",
	repairSystem: "Mechanical",
	startWarranty: new Date().toISOString().split("T")[0],
	requester: "",
	sabNumber: "",
	acceptedBy: "",
	company: "pendingsystem",
});

const createEmptyPart = (): PartEntry => ({
	id: generateId(),
	partNumber: "",
	description: "",
});

const createInitialFormData = (row: PendingRow): FormData => ({
	customerName: row.customerName || "",
	vin: row.vin || "",
	mobile: row.mobile || "",
	cntrRdg:
		row.cntrRdg !== null && row.cntrRdg !== undefined
			? String(row.cntrRdg)
			: "",
	model: row.model || "",
	repairSystem: row.repairSystem || "Mechanical",
	startWarranty: row.startWarranty || new Date().toISOString().split("T")[0],
	requester: row.requester || "",
	sabNumber: row.sabNumber || "",
	acceptedBy: row.acceptedBy || "",
	company: row.company || "pendingsystem",
});

const createInitialParts = (rows: PendingRow[]): PartEntry[] =>
	rows.map((row) => ({
		id: generateId(),
		partNumber: row.partNumber || "",
		description: row.description || "",
		rowId: row.id,
	}));

const calculateRemainingBeastModeTime = (triggerTime?: number): number => {
	if (!triggerTime) return 0;
	const elapsed = Math.floor((Date.now() - triggerTime) / 1000);
	return elapsed < 30 ? 30 - elapsed : 0;
};

const getBeastModeFieldErrors = (data: FormData): Set<string> => {
	const result = BeastModeSchema.safeParse(data);
	if (result.success) return new Set();
	const { fieldErrors } = z.flattenError(result.error);
	return new Set(Object.keys(fieldErrors));
};

const mapSchemaFieldErrors = (
	fieldErrors: Record<string, string[] | undefined>,
): FormErrors => {
	const newErrors: FormErrors = {};
	for (const [key, messages] of Object.entries(fieldErrors)) {
		newErrors[key as keyof FormData] = messages?.[0] || "";
	}
	return newErrors;
};

const normalizeDescription = (value?: string | null): string =>
	(value || "").trim().toLowerCase();

const buildPartValidationWarnings = (
	parts: PartEntry[],
	vin: string,
	lists: ValidationList[],
): PartValidationWarnings => {
	const warnings: PartValidationWarnings = {};
	const upperVin = vin.toUpperCase();

	for (const part of parts) {
		if (!part.partNumber || !vin) continue;
		const upperPart = part.partNumber.toUpperCase();

		for (const list of lists) {
			const hasDuplicate = list.rows.some(
				(row) =>
					row.vin?.toUpperCase() === upperVin &&
					row.partNumber?.toUpperCase() === upperPart &&
					row.id !== part.rowId,
			);
			if (hasDuplicate) {
				warnings[part.id] = {
					type: "duplicate",
					value: "The order already exists",
					location: list.name,
				};
				break;
			}
		}
		if (warnings[part.id]) continue;

		for (const list of lists) {
			const existingRow = list.rows.find(
				(row) => row.partNumber?.toUpperCase() === upperPart,
			);
			if (!existingRow) continue;

			if (
				normalizeDescription(existingRow.description) !==
				normalizeDescription(part.description)
			) {
				warnings[part.id] = {
					type: "mismatch",
					value: existingRow.description || "",
				};
				break;
			}
		}
	}

	return warnings;
};

const parsePersonalBulkFormData = (
	bulkText: string,
	currentFormData: FormData,
): FormData | null => {
	if (!bulkText.trim()) return null;
	const rowParts = bulkText.split(/\t|\s{4,}/).filter(Boolean);
	if (rowParts.length === 0) return null;

	return {
		...currentFormData,
		customerName: rowParts[0]?.trim() || currentFormData.customerName,
		vin: (rowParts[1]?.trim() || currentFormData.vin).toUpperCase(),
		mobile: rowParts[2]?.trim() || currentFormData.mobile,
		cntrRdg: rowParts[3]?.trim() || currentFormData.cntrRdg,
		sabNumber: rowParts[4]?.trim() || currentFormData.sabNumber,
		acceptedBy: rowParts[5]?.trim() || currentFormData.acceptedBy,
	};
};

const parseBulkParts = (bulkText: string): PartEntry[] => {
	if (!bulkText.trim()) return [];
	const lines = bulkText.split("\n");

	return lines
		.map((line) => {
			const rowParts = line.split(/\t|\s{4,}/).filter(Boolean);
			if (rowParts.length === 0) return null;
			return {
				id: generateId(),
				partNumber: rowParts[0]?.trim() || "",
				description: rowParts.slice(1).join(" ").trim() || "",
			};
		})
		.filter(
			(part): part is PartEntry =>
				part !== null && (part.partNumber !== "" || part.description !== ""),
		);
};

const shouldReplaceInitialEmptyPart = (parts: PartEntry[]): boolean =>
	parts.length === 1 && !parts[0].partNumber && !parts[0].description;

const getDialogTitleText = (
	isEditMode: boolean,
	isMultiSelection: boolean,
	selectedCount: number,
): string => {
	if (!isEditMode) return "New Logistics Request";
	if (isMultiSelection) return `Bulk Edit (${selectedCount})`;
	return "Modify Order";
};

const getValidationSummaryText = (warnings: PartValidationWarnings): string => {
	const warningValues = Object.values(warnings);
	if (warningValues.length === 0) return "";
	if (warningValues.length === 1) {
		const [warning] = warningValues;
		if (warning.type === "duplicate") return "The order already exists";
		return `(name is "${warning.value}")`;
	}
	return `(${warningValues.length} Mismatched Names)`;
};

const getSubmitButtonText = (
	isEditMode: boolean,
	isMultiSelection: boolean,
): string => {
	if (!isEditMode) return "Publish";
	if (isMultiSelection) return "Commit Batch";
	return "Commit";
};

export const OrderFormModal = ({
	open,
	onOpenChange,
	isEditMode,
	selectedRows,
	onSubmit,
}: OrderFormModalProps) => {
	// Server data access from Zustand removed - DUPLICATE VALIDATION DISABLED IN Modal
	const rowData: ValidationRow[] = [];
	const ordersRowData: ValidationRow[] = [];
	const callRowData: ValidationRow[] = [];
	const bookingRowData: ValidationRow[] = [];
	const archiveRowData: ValidationRow[] = [];
	const models = useAppStore((state) => state.models);
	const addModel = useAppStore((state) => state.addModel);
	const removeModel = useAppStore((state) => state.removeModel);
	const repairSystems = useAppStore((state) => state.repairSystems);
	const addRepairSystem = useAppStore((state) => state.addRepairSystem);
	const removeRepairSystem = useAppStore((state) => state.removeRepairSystem);
	const beastModeTriggers = useAppStore((state) => state.beastModeTriggers);

	const [isBulkMode, setIsBulkMode] = useState(false);
	const [bulkText, setBulkText] = useState("");
	const [isPersonalBulkMode, setIsPersonalBulkMode] = useState(false);
	const [personalBulkText, setPersonalBulkText] = useState("");

	const [formData, setFormData] = useState<FormData>(createDefaultFormData());
	const [errors, setErrors] = useState<FormErrors>({});
	const [validationMode, setValidationMode] = useState<"easy" | "beast">(
		"easy",
	);
	const [beastModeTimer, setBeastModeTimer] = useState<number | null>(null);
	const [beastModeErrors, setBeastModeErrors] = useState<Set<string>>(
		new Set(),
	);

	const [parts, setParts] = useState<PartEntry[]>([createEmptyPart()]);
	const descriptionRefs = useRef<(HTMLInputElement | null)[]>([]);

	const isMultiSelection = selectedRows.length > 1;

	useEffect(() => {
		if (!open) return;

		if (!isEditMode || selectedRows.length === 0) {
			setFormData(createDefaultFormData());
			setParts([createEmptyPart()]);
			setIsBulkMode(false);
			setBulkText("");
			setIsPersonalBulkMode(false);
			setPersonalBulkText("");
			setValidationMode("easy");
			setBeastModeErrors(new Set());
			setBeastModeTimer(null);
			return;
		}

		const firstRow = selectedRows[0];
		const initialFormData = createInitialFormData(firstRow);
		const remainingGlobalTime = calculateRemainingBeastModeTime(
			beastModeTriggers[firstRow.id],
		);

		setFormData(initialFormData);
		setParts(createInitialParts(selectedRows));

		if (remainingGlobalTime > 0) {
			setValidationMode("beast");
			setBeastModeTimer(remainingGlobalTime);
			setBeastModeErrors(getBeastModeFieldErrors(initialFormData));
			return;
		}

		setValidationMode("easy");
		setBeastModeErrors(new Set());
		setBeastModeTimer(null);
	}, [open, isEditMode, selectedRows]);

	useEffect(() => {
		if (formData.vin.length >= 6) {
			const detectedValue = detectModelFromVin(formData.vin);
			if (detectedValue && !formData.model) {
				setFormData((prev) => ({ ...prev, model: detectedValue }));
			}
		}
	}, [formData.vin, formData.model]);

	// Beast Mode Timer Logic
	useEffect(() => {
		if (validationMode !== "beast") return;

		const timer = setInterval(() => {
			setBeastModeTimer((prev) => {
				if (prev === null || prev <= 1) {
					setValidationMode("easy");
					setBeastModeErrors(new Set());
					return null;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [validationMode]);

	const handlePersonalBulkImport = () => {
		const importedFormData = parsePersonalBulkFormData(
			personalBulkText,
			formData,
		);
		if (!importedFormData) return;
		setFormData(importedFormData);
		setPersonalBulkText("");
		setIsPersonalBulkMode(false);
		toast.success("Identity fields updated");
	};

	const handleBulkImport = () => {
		const importedParts = parseBulkParts(bulkText);
		if (importedParts.length === 0) return;

		setParts(
			shouldReplaceInitialEmptyPart(parts)
				? importedParts
				: [...parts, ...importedParts],
		);
		setBulkText("");
		setIsBulkMode(false);
		toast.success(`${importedParts.length} parts imported`);
	};

	const handleAddPartRow = () => {
		setParts([...parts, { id: generateId(), partNumber: "", description: "" }]);
	};

	const handleRemovePartRow = (id: string) => {
		setParts(parts.filter((p) => p.id !== id));
	};

	const handlePartChange = (
		id: string,
		field: keyof PartEntry,
		value: string,
	) => {
		setParts(parts.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
	};

	const isHighMileage = (parseInt(formData.cntrRdg, 10) || 0) >= 100000;

	const partValidationWarnings = useMemo(
		() =>
			buildPartValidationWarnings(parts, formData.vin, [
				{ name: "Main Sheet", rows: rowData },
				{ name: "Orders", rows: ordersRowData },
				{ name: "Call List", rows: callRowData },
				{ name: "Booking", rows: bookingRowData },
				{ name: "Archive", rows: archiveRowData },
			]),
		[
			parts,
			rowData,
			ordersRowData,
			callRowData,
			bookingRowData,
			archiveRowData,
			formData.vin,
		],
	);

	const hasValidationErrors = Object.keys(partValidationWarnings).length > 0;

	const getFieldError = (fieldName: keyof FormData) => {
		if (validationMode === "beast") {
			return beastModeErrors.has(fieldName);
		}
		return errors[fieldName] !== undefined;
	};

	const validateForm = () => {
		const result = OrderFormSchema.safeParse(formData);
		if (!result.success) {
			const { fieldErrors } = z.flattenError(result.error);
			setErrors(mapSchemaFieldErrors(fieldErrors));
			return false;
		}
		setErrors({});
		return true;
	};

	const handleLocalSubmit = () => {
		// Identify if we are attempting a "Commit" (Beast Mode Trigger)
		const isCommitAction = isEditMode && !isMultiSelection; // "Commit" label is shown here

		if (isCommitAction || validationMode === "beast") {
			// Validate with Beast Mode schema
			const result = BeastModeSchema.safeParse(formData);

			if (!result.success) {
				// Enter Beast Mode
				setValidationMode("beast");
				setBeastModeTimer(30);

				// Collect missing fields for red highlights
				const { fieldErrors } = z.flattenError(result.error);
				setBeastModeErrors(new Set(Object.keys(fieldErrors)));

				// Show grouped toast (prevent duplicate toasts with fixed ID)
				toast.error("Missing Info: Please complete the highlighted fields.", {
					id: "beast-mode-validation-error",
				});
				return;
			}
		}

		// Regular validation (Easy Mode) for non-commit or if beast passed
		const isFormValid = validateForm();

		if (hasValidationErrors) {
			toast.error(
				"Please correct mismatched part descriptions before submitting.",
			);
			return;
		}

		if (!isFormValid && validationMode !== "beast") {
			toast.error("Please fill in all required fields correctly.");
			return;
		}

		onSubmit(formData, parts);
	};

	const dialogTitleText = getDialogTitleText(
		isEditMode,
		isMultiSelection,
		selectedRows.length,
	);
	const validationSummaryText = getValidationSummaryText(
		partValidationWarnings,
	);
	const submitButtonText = getSubmitButtonText(isEditMode, isMultiSelection);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl p-0 overflow-hidden border border-white/5 bg-[#0c0c0e] text-slate-200 shadow-2xl shadow-black/50">
				<div className="relative overflow-hidden group">
					<div
						className={cn(
							"absolute inset-0 opacity-15 blur-xl transition-all duration-700",
							isEditMode ? "bg-amber-500" : "bg-indigo-500",
						)}
					/>
					<div
						className={cn(
							"relative px-6 py-4 border-b border-white/5 backdrop-blur-md flex items-center justify-between",
							isEditMode ? "bg-amber-500/10" : "bg-indigo-500/10",
						)}
					>
						<div className="flex items-center gap-3">
							<div
								className={cn(
									"p-2 rounded-lg transition-colors duration-500 shadow-md",
									isEditMode
										? "bg-amber-500 text-black"
										: "bg-indigo-500 text-white",
								)}
							>
								{isEditMode ? (
									<Pencil className="h-4 w-4" />
								) : (
									<Plus className="h-4 w-4" />
								)}
							</div>
							<div>
								<DialogTitle className="text-lg font-bold tracking-tight text-white leading-none">
									{dialogTitleText}
								</DialogTitle>
								<DialogDescription className="text-slate-500 text-[10px] mt-0.5 uppercase tracking-wider font-bold">
									{isMultiSelection
										? "Synchronizing batch metadata"
										: "Vehicle Repair Command Center"}
								</DialogDescription>
							</div>
						</div>

						<AnimatePresence>
							{validationMode === "beast" && beastModeTimer !== null && (
								<motion.div
									className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 group cursor-default"
									initial={{ opacity: 0, y: -5 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -5 }}
								>
									<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-sm">
										<motion.div
											className={cn(
												"w-1.5 h-1.5 rounded-full",
												beastModeTimer > 10
													? "bg-amber-500/50"
													: "bg-red-500/50",
											)}
											animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
											transition={{
												duration: 2,
												repeat: Infinity,
												ease: "easeInOut",
											}}
										/>
										<span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
											Commit Window:
										</span>
										<span
											className={cn(
												"text-xs font-mono font-medium transition-colors duration-500",
												beastModeTimer > 10
													? "text-amber-500/70"
													: "text-red-500/70",
											)}
										>
											{beastModeTimer}s
										</span>
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>

				<div className="p-5 grid grid-cols-12 gap-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
					<div className="col-span-12 lg:col-span-5 space-y-4">
						<div className="space-y-3">
							<div className="flex items-center justify-between mb-1">
								<div className="flex items-center gap-2">
									<User className="h-3 w-3 text-slate-500" />
									<h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
										Core Identity
									</h3>
								</div>
								<Button
									variant="ghost"
									size="icon"
									className={cn(
										"h-6 w-6 rounded-lg transition-all",
										isPersonalBulkMode
											? "bg-indigo-500/20 text-indigo-400"
											: "text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10",
									)}
									onClick={() => setIsPersonalBulkMode(!isPersonalBulkMode)}
								>
									<FileSpreadsheet className="h-3 w-3" />
								</Button>
							</div>

							<AnimatePresence mode="wait">
								{isPersonalBulkMode ? (
									<motion.div
										key="personal-bulk"
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										className="space-y-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10"
									>
										<div className="space-y-1">
											<Label className="text-[9px] font-bold text-indigo-400 uppercase ml-1">
												Smart Paste (Name | VIN | Mobile | KM | SAB | Agent)
											</Label>
											<Textarea
												placeholder="Paste single line here..."
												value={personalBulkText}
												onChange={(e) => setPersonalBulkText(e.target.value)}
												className="h-20 resize-none bg-[#0a0a0b]/60 border-white/5 text-[10px] p-2 rounded-lg focus:ring-1 focus:ring-indigo-500/30"
											/>
										</div>
										<div className="flex gap-2">
											<Button
												onClick={handlePersonalBulkImport}
												className="flex-1 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-widest"
											>
												Confirm Identity
											</Button>
											<Button
												variant="ghost"
												onClick={() => setIsPersonalBulkMode(false)}
												className="h-7 px-3 rounded-lg text-slate-500 text-[9px] font-black uppercase"
											>
												Cancel
											</Button>
										</div>
									</motion.div>
								) : (
									<motion.div
										key="personal-fields"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										className="space-y-3"
									>
										{/* [CRITICAL] Core Identity Layout - Side-by-side (Customer/Company) and (VIN/Odo) 
										    MUST be preserved to eliminate scrolling on standard displays. */}
										<div className="grid grid-cols-10 gap-3">
											<div className="col-span-7 space-y-1 group">
												<Label className="text-[10px] font-bold text-slate-500 ml-1 group-focus-within:text-slate-300 transition-colors uppercase">
													Customer
												</Label>
												<Input
													placeholder="Full Name"
													value={formData.customerName}
													onChange={(e) =>
														setFormData({
															...formData,
															customerName: e.target.value,
														})
													}
													className={cn(
														"bg-[#161618] border-white/5 h-9 text-xs rounded-lg px-3 transition-all",
														getFieldError("customerName") &&
															"border-red-500/50 ring-1 ring-red-500/20",
														isEditMode
															? "premium-glow-amber"
															: "premium-glow-indigo",
													)}
												/>
												{errors.customerName && (
													<p className="text-[9px] text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
														{errors.customerName}
													</p>
												)}
											</div>
											<div className="col-span-3 space-y-1 group">
												<Label className="text-[10px] font-bold text-slate-500 ml-1 group-focus-within:text-slate-300 transition-colors uppercase">
													Company
												</Label>
												<div className="relative">
													<select
														value={formData.company}
														onChange={(e) =>
															setFormData({
																...formData,
																company: e.target.value,
															})
														}
														className={cn(
															"w-full bg-[#161618] border-white/5 h-9 text-xs rounded-lg px-3 transition-all appearance-none outline-none focus:ring-0",
															isEditMode
																? "premium-glow-amber text-amber-500"
																: "premium-glow-indigo text-indigo-400 font-bold",
														)}
													>
														<option value="pendingsystem">pendingsystem</option>
														<option value="Zeekr">Zeekr</option>
													</select>
													<ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
												</div>
											</div>
										</div>
										<div className="grid grid-cols-10 gap-3">
											<div className="col-span-7 space-y-1 group">
												<Label className="text-[10px] font-bold text-slate-500 ml-1 group-focus-within:text-slate-300 transition-colors uppercase">
													VIN Number
												</Label>
												<Input
													placeholder="VF1..."
													value={formData.vin}
													onChange={(e) =>
														setFormData({
															...formData,
															vin: e.target.value.toUpperCase(),
														})
													}
													className={cn(
														"bg-[#161618] border-white/5 h-9 text-xs font-mono tracking-widest rounded-lg px-3 transition-all",
														getFieldError("vin") &&
															"border-red-500/50 ring-1 ring-red-500/20",
														isEditMode
															? "premium-glow-amber"
															: "premium-glow-indigo",
													)}
												/>
												{errors.vin && (
													<p className="text-[9px] text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
														{errors.vin}
													</p>
												)}
											</div>
											<div className="col-span-3 space-y-1 group">
												<Label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">
													Odo (KM)
												</Label>
												<Input
													type="number"
													placeholder="0"
													value={formData.cntrRdg}
													onChange={(e) =>
														setFormData({
															...formData,
															cntrRdg: e.target.value,
														})
													}
													className={cn(
														"bg-[#161618] border-white/5 h-9 text-xs rounded-lg px-3 transition-all",
														getFieldError("cntrRdg") &&
															"border-red-500/50 ring-1 ring-red-500/20",
														isEditMode
															? "premium-glow-amber"
															: "premium-glow-indigo",
													)}
												/>
												{errors.cntrRdg && (
													<p className="text-[9px] text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1 leading-tight">
														{errors.cntrRdg}
													</p>
												)}
											</div>
										</div>
										<div className="grid grid-cols-2 gap-3">
											<div className="space-y-1 group">
												<Label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">
													Mobile
												</Label>
												<Input
													placeholder="0xxxxxxxxx"
													value={formData.mobile}
													onChange={(e) =>
														setFormData({ ...formData, mobile: e.target.value })
													}
													className={cn(
														"bg-[#161618] border-white/5 h-9 text-xs rounded-lg px-3 transition-all",
														getFieldError("mobile") &&
															"border-red-500/50 ring-1 ring-red-500/20",
														isEditMode
															? "premium-glow-amber"
															: "premium-glow-indigo",
													)}
												/>
											</div>
											<div className="space-y-1 group">
												<Label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">
													Accepted By
												</Label>
												<Input
													placeholder="Agent Name"
													value={formData.acceptedBy}
													onChange={(e) =>
														setFormData({
															...formData,
															acceptedBy: e.target.value,
														})
													}
													className={cn(
														"bg-[#161618] border-white/5 h-9 text-xs rounded-lg px-3 transition-all",
														getFieldError("acceptedBy") &&
															"border-red-500/50 ring-1 ring-red-500/20",
														isEditMode
															? "premium-glow-amber"
															: "premium-glow-indigo",
													)}
												/>
											</div>
										</div>
										<div className="grid grid-cols-2 gap-3">
											<div className="space-y-1 group">
												<Label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">
													SAB NO.
												</Label>
												<Input
													placeholder="Order SAB"
													value={formData.sabNumber}
													onChange={(e) =>
														setFormData({
															...formData,
															sabNumber: e.target.value,
														})
													}
													className={cn(
														"bg-[#161618] border-white/5 h-9 text-xs rounded-lg px-3 transition-all",
														getFieldError("sabNumber") &&
															"border-red-500/50 ring-1 ring-red-500/20",
														isEditMode
															? "premium-glow-amber"
															: "premium-glow-indigo",
													)}
												/>
											</div>
											<div className="space-y-1 group">
												<Label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">
													Vehicle Model
												</Label>
												<div
													className={cn(
														"rounded-lg transition-all",
														getFieldError("model") &&
															"border-red-500/50 ring-1 ring-red-500/20",
														isEditMode
															? "premium-glow-amber"
															: "premium-glow-indigo",
													)}
												>
													<EditableSelect
														options={models}
														value={formData.model}
														onChange={(val) =>
															setFormData({ ...formData, model: val })
														}
														onAdd={addModel}
														onRemove={removeModel}
														placeholder="Select model..."
													/>
												</div>
												{errors.model && (
													<p className="text-[9px] text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
														{errors.model}
													</p>
												)}
											</div>
										</div>
										<div
											className={cn(
												"grid gap-3 transition-all duration-300",
												formData.repairSystem === "ضمان"
													? "grid-cols-12"
													: "grid-cols-1",
											)}
										>
											<div
												className={cn(
													"space-y-1 group",
													formData.repairSystem === "ضمان"
														? "col-span-4"
														: "col-span-1",
												)}
											>
												<Label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">
													Repair System
												</Label>
												<div
													className={cn(
														"rounded-lg transition-all",
														isEditMode
															? "premium-glow-amber"
															: "premium-glow-indigo",
													)}
												>
													<EditableSelect
														options={repairSystems}
														value={formData.repairSystem}
														onChange={(val) =>
															setFormData({ ...formData, repairSystem: val })
														}
														onAdd={addRepairSystem}
														onRemove={removeRepairSystem}
													/>
												</div>
											</div>
											<AnimatePresence mode="wait">
												{formData.repairSystem === "ضمان" && (
													<motion.div
														key="warranty-fields-inline"
														initial={{ opacity: 0, x: 10 }}
														animate={{ opacity: 1, x: 0 }}
														exit={{ opacity: 0, x: 10 }}
														className="col-span-8 flex flex-col gap-3"
													>
														<div className="space-y-1 group">
															<Label className="text-[10px] font-bold text-slate-500 ml-1 uppercase">
																ICM Date
															</Label>
															<SimpleDatePicker
																value={formData.startWarranty}
																onChange={(val) =>
																	setFormData({
																		...formData,
																		startWarranty: val,
																	})
																}
																className={cn(
																	isEditMode
																		? "premium-glow-amber"
																		: "premium-glow-indigo",
																)}
															/>
														</div>
													</motion.div>
												)}
											</AnimatePresence>
										</div>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</div>

					<div className="col-span-12 lg:col-span-7 flex flex-col min-h-[300px]">
						<div className="flex-1 bg-white/[0.01] rounded-2xl border border-white/5 p-4 flex flex-col relative overflow-hidden">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-2">
									<ClipboardList className="h-3 w-3 text-slate-500" />
									<h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
										Components
									</h3>
								</div>
								<div className="flex items-center gap-1.5">
									<Button
										variant="ghost"
										size="icon"
										className={cn(
											"h-7 w-7 rounded-lg transition-all",
											isBulkMode
												? "bg-indigo-500/20 text-indigo-400"
												: "text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10",
										)}
										onClick={() => setIsBulkMode(!isBulkMode)}
									>
										<FileSpreadsheet className="h-3.5 w-3.5" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className={cn(
											"h-7 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
											isEditMode
												? "text-amber-500 hover:bg-amber-500/10"
												: "text-indigo-400 hover:bg-indigo-500/10",
										)}
										onClick={handleAddPartRow}
									>
										<Plus className="h-3 w-3 mr-1" /> Add Entry
									</Button>
								</div>
							</div>

							<div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
								<AnimatePresence mode="wait">
									{isBulkMode ? (
										<motion.div
											key="bulk-mode"
											initial={{ opacity: 0, scale: 0.98 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.98 }}
											className="h-full flex flex-col space-y-3"
										>
											<div className="relative group/bulk flex-1 min-h-[160px]">
												<div className="absolute -inset-px bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl blur-sm opacity-0 group-hover/bulk:opacity-100 transition-opacity" />
												<Textarea
													placeholder="Paste your part list here..."
													value={bulkText}
													onChange={(e) => setBulkText(e.target.value)}
													className="relative h-full resize-none bg-[#0a0a0b]/60 border-white/5 text-[10px] font-mono p-3 rounded-xl focus:ring-1 focus:ring-indigo-500/30 placeholder:text-slate-600 custom-scrollbar"
												/>
											</div>
											<div className="flex items-center gap-2">
												<Button
													onClick={handleBulkImport}
													disabled={!bulkText.trim()}
													className="flex-1 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
												>
													Import Parsed Data
												</Button>
												<Button
													variant="ghost"
													onClick={() => {
														setIsBulkMode(false);
														setBulkText("");
													}}
													className="h-8 px-3 rounded-lg text-slate-500 hover:text-white text-[10px] font-black uppercase"
												>
													Cancel
												</Button>
											</div>
										</motion.div>
									) : (
										<motion.div
											key="list-mode"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											className="space-y-2"
										>
											<AnimatePresence initial={false}>
												{parts.map((part, index) => (
													<motion.div
														key={part.id}
														initial={{ opacity: 0, y: 5 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, scale: 0.98 }}
													>
														<div
															className={cn(
																"flex flex-col gap-1 p-1.5 rounded-xl border transition-all hover:bg-white/[0.04]",
																partValidationWarnings[part.id]
																	? "bg-red-500/5 border-red-500/20"
																	: "bg-white/[0.02] border-white/5",
																"group/row",
															)}
														>
															<div className="flex items-center gap-2">
																<div className="w-1/3">
																	<Input
																		placeholder="REF#"
																		value={part.partNumber}
																		onChange={(e) =>
																			handlePartChange(
																				part.id,
																				"partNumber",
																				e.target.value,
																			)
																		}
																		className={cn(
																			"bg-white/5 border-white/5 h-8 text-[10px] font-mono rounded-lg px-2 focus:ring-1",
																			isEditMode
																				? "focus:ring-amber-500/30"
																				: "focus:ring-indigo-500/30",
																		)}
																	/>
																</div>
																<div className="flex-1">
																	<Input
																		ref={(el) => {
																			descriptionRefs.current[index] = el;
																		}}
																		placeholder="Description"
																		value={part.description}
																		onChange={(e) =>
																			handlePartChange(
																				part.id,
																				"description",
																				e.target.value,
																			)
																		}
																		onKeyDown={(e) => {
																			if (e.key === "Enter") {
																				e.preventDefault();
																				handleAddPartRow();
																				setTimeout(() => {
																					descriptionRefs.current[
																						index + 1
																					]?.focus();
																				}, 0);
																			}
																		}}
																		className={cn(
																			"bg-white/5 border-white/5 h-8 text-[10px] rounded-lg px-2 focus:ring-1",
																			isEditMode
																				? "focus:ring-amber-500/30"
																				: "focus:ring-indigo-500/30",
																		)}
																	/>
																</div>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-7 w-7 text-slate-600 hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-opacity"
																	onClick={() => handleRemovePartRow(part.id)}
																>
																	<X className="h-3.5 w-3.5" />
																</Button>
															</div>
															{partValidationWarnings[part.id] && (
																<div className="px-2 pb-1 flex items-center justify-between">
																	<div className="flex items-center gap-1.5 text-red-400">
																		<AlertCircle className="h-3 w-3" />
																		<span className="text-[9px] font-bold uppercase tracking-tight">
																			{partValidationWarnings[part.id].type ===
																			"duplicate"
																				? `${partValidationWarnings[part.id].value} in ${partValidationWarnings[part.id].location}`
																				: `Existing Name: "${partValidationWarnings[part.id].value}"`}
																		</span>
																	</div>
																	{partValidationWarnings[part.id].type ===
																		"mismatch" && (
																		<Button
																			variant="ghost"
																			size="icon"
																			className="h-5 w-5 rounded-md hover:bg-red-500/20 text-red-500"
																			onClick={() =>
																				handlePartChange(
																					part.id,
																					"description",
																					partValidationWarnings[part.id].value,
																				)
																			}
																			title="Apply existing name"
																		>
																			<CheckCircle2 className="h-3 w-3" />
																		</Button>
																	)}
																</div>
															)}
														</div>
													</motion.div>
												))}
											</AnimatePresence>
											{parts.length === 0 && (
												<div className="h-full flex flex-col items-center justify-center space-y-2 py-10 opacity-10">
													<Package className="h-8 w-8" />
													<p className="text-[10px] font-bold uppercase tracking-widest">
														Idle
													</p>
												</div>
											)}
										</motion.div>
									)}
								</AnimatePresence>
							</div>

							<div className="mt-4 pt-4 border-t border-white/5">
								<div className="flex items-center gap-2 group">
									<MapPin className="h-3 w-3 text-slate-600" />
									<Input
										placeholder="Requester / Branch"
										value={formData.requester}
										onChange={(e) =>
											setFormData({ ...formData, requester: e.target.value })
										}
										className={cn(
											"bg-transparent border-transparent h-8 text-xs px-0 hover:bg-white/5 focus:bg-white/5 focus:border-white/5 transition-all text-slate-400 focus:text-slate-200",
											isEditMode
												? "focus:border-amber-500/20"
												: "focus:border-indigo-500/20",
										)}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="px-6 py-4 bg-white/[0.01] border-t border-white/5">
					<div className="flex items-center justify-between w-full">
						<div className="flex items-center gap-3">
							<Button
								variant="ghost"
								className="h-9 px-4 rounded-lg text-[10px] font-bold text-slate-500 hover:text-white transition-all uppercase tracking-widest"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<AnimatePresence>
								{/* [CRITICAL] Warranty Status Footer - Real-time calculations for Repair System "ضمان"
								    This section provides essential visibility for warranty/mileage status. */}
								{formData.repairSystem === "ضمان" && (
									<motion.div
										initial={{ opacity: 0, scale: 0.95 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.95 }}
										className="flex items-center gap-2"
									>
										<span className="text-[9px] font-bold text-slate-500 uppercase">
											Warranty:
										</span>
										{isHighMileage ? (
											<div
												className="h-8 px-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center overflow-hidden shadow-inner uppercase tracking-tighter cursor-help"
												title="Vehicle exceeds 100,000 KM"
											>
												<span className="text-[10px] text-red-500 font-mono font-black">
													HIGH MILEAGE
												</span>
											</div>
										) : (
											(() => {
												const end = calculateEndWarranty(
													formData.startWarranty,
												);
												const remain = calculateRemainingTime(end);
												const isExpired = remain === "Expired";
												return (
													<div
														className={cn(
															"h-8 px-3 rounded-lg border flex items-center justify-center overflow-hidden shadow-inner uppercase tracking-tighter",
															isExpired
																? "bg-red-500/10 border-red-500/20 text-red-500"
																: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
														)}
													>
														<span className="text-[10px] font-mono font-black truncate">
															{remain || "--"}
														</span>
													</div>
												);
											})()
										)}
									</motion.div>
								)}
							</AnimatePresence>
						</div>
						<div className="flex items-center gap-3">
							<AnimatePresence>
								{formData.repairSystem === "ضمان" && isHighMileage && (
									<motion.div
										initial={{ opacity: 0, scale: 0.95 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.95 }}
									>
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 cursor-help transition-all hover:bg-orange-500/20">
													<AlertCircle className="h-3.5 w-3.5" />
													<span className="text-[10px] font-black uppercase tracking-wider">
														Ineligible
													</span>
												</div>
											</TooltipTrigger>
											<TooltipContent
												side="top"
												className="bg-[#1c1c1f] border-white/10 text-orange-200 text-[10px] p-2 max-w-[200px]"
											>
												Vehicle exceeds 100,000 KM limitation.
											</TooltipContent>
										</Tooltip>
									</motion.div>
								)}
							</AnimatePresence>
							<AnimatePresence>
								{hasValidationErrors && (
									<motion.div
										initial={{ opacity: 0, scale: 0.95 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.95 }}
										className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 transition-all cursor-default"
									>
										<AlertCircle className="h-3.5 w-3.5 animate-pulse" />
										<span className="text-[10px] font-black uppercase tracking-wider">
											{validationSummaryText}
										</span>
									</motion.div>
								)}
							</AnimatePresence>
							<Button
								className={cn(
									"h-10 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-[0.98]",
									isEditMode
										? "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/10"
										: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/10",
								)}
								onClick={handleLocalSubmit}
							>
								{submitButtonText}
								<CheckCircle2 className="ml-2 h-3 w-3" />
							</Button>
						</div>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
