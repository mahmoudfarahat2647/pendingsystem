"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronsUpDown, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EditableSelect } from "@/components/shared/EditableSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleDatePicker } from "@/components/ui/simple-date-picker";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateAppSettingsMutation } from "@/hooks/mutations/useUpdateAppSettingsMutation";
import { useAppSettingsQuery } from "@/hooks/queries/useAppSettingsQuery";
import { ALLOWED_COMPANIES } from "@/lib/ordersValidationConstants";
import { cn, normalizeMileage } from "@/lib/utils";
import type { FormData } from "./types";

interface IdentityFieldsProps {
	formData: FormData;
	onFieldChange: (updated: Partial<FormData>) => void;
	errors: Partial<Record<keyof FormData, string>>;
	getFieldError: (field: keyof FormData) => boolean;
	isEditMode: boolean;
}

/**
 * Left panel of the order form.
 * Renders core identity fields and owns the personal bulk-import state.
 * Fetches models/repairSystems from Supabase via React Query (useAppSettingsQuery).
 */
export const IdentityFields = ({
	formData,
	onFieldChange,
	errors,
	getFieldError,
	isEditMode,
}: IdentityFieldsProps) => {
	const { data: appSettings, isPlaceholderData: settingsLoading } =
		useAppSettingsQuery();
	const updateAppSettings = useUpdateAppSettingsMutation();
	const models = appSettings?.models ?? [];
	const repairSystems = appSettings?.repairSystems ?? [];

	// Personal bulk import state (owned here, not exposed to parent)
	const [isPersonalBulkMode, setIsPersonalBulkMode] = useState(false);
	const [personalBulkText, setPersonalBulkText] = useState("");

	const handlePersonalBulkImport = () => {
		if (!personalBulkText.trim()) return;
		const rowParts = personalBulkText.split(/\t|\s{4,}/).filter(Boolean);
		if (rowParts.length > 0) {
			onFieldChange({
				customerName: rowParts[0]?.trim() || formData.customerName,
				vin: (rowParts[1]?.trim() || formData.vin).toUpperCase(),
				mobile: rowParts[2]?.trim() || formData.mobile,
				cntrRdg: normalizeMileage(rowParts[3]) || formData.cntrRdg,
				sabNumber: rowParts[4]?.trim() || formData.sabNumber,
				acceptedBy: rowParts[5]?.trim() || formData.acceptedBy,
			});
			setPersonalBulkText("");
			setIsPersonalBulkMode(false);
			toast.success("Identity fields updated");
		}
	};

	const glowClass = isEditMode ? "premium-glow-amber" : "premium-glow-indigo";

	return (
		<div className="col-span-12 lg:col-span-5 space-y-4">
			<div className="space-y-3">
				{/* Section header */}
				<div className="flex items-center justify-between mb-1">
					<div className="flex items-center gap-2">
						<SimpleDatePicker
							value={formData.rDate}
							onChange={(val) => onFieldChange({ rDate: val })}
							placeholder="R/DATE"
							className="h-6 text-[10px]"
						/>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						aria-label="Bulk Import"
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
									type="button"
									onClick={handlePersonalBulkImport}
									className="flex-1 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-widest"
								>
									Confirm Identity
								</Button>
								<Button
									type="button"
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
											onFieldChange({ customerName: e.target.value })
										}
										className={cn(
											"bg-[#161618] border-white/5 h-9 text-xs rounded-lg px-3 transition-all",
											getFieldError("customerName") &&
												"border-red-500/50 ring-1 ring-red-500/20",
											glowClass,
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
									<div
										className={cn(
											"relative rounded-lg transition-all",
											getFieldError("company") && "ring-2 ring-red-500/50",
										)}
									>
										<select
											value={formData.company}
											onChange={(e) =>
												onFieldChange({ company: e.target.value })
											}
											className={cn(
												"w-full bg-[#161618] border-white/5 h-9 text-xs rounded-lg px-3 transition-all appearance-none outline-none focus:ring-0",
												formData.company === ""
													? "text-slate-500"
													: isEditMode
														? "premium-glow-amber text-amber-500"
														: "premium-glow-indigo text-indigo-400 font-bold",
											)}
										>
											<option value="" disabled>
												Select
											</option>
											{!ALLOWED_COMPANIES.includes(
												formData.company as (typeof ALLOWED_COMPANIES)[number],
											) &&
												formData.company !== "" && (
													<option value={formData.company}>
														{formData.company}
													</option>
												)}
											{ALLOWED_COMPANIES.map((company) => (
												<option key={company} value={company}>
													{company}
												</option>
											))}
										</select>
										<ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
									</div>
									{errors.company && (
										<p className="text-[9px] text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
											{errors.company}
										</p>
									)}
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
											onFieldChange({ vin: e.target.value.toUpperCase() })
										}
										className={cn(
											"bg-[#161618] border-white/5 h-9 text-xs font-mono tracking-widest rounded-lg px-3 transition-all",
											getFieldError("vin") &&
												"border-red-500/50 ring-1 ring-red-500/20",
											glowClass,
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
										type="text"
										inputMode="numeric"
										placeholder="0"
										value={formData.cntrRdg}
										onChange={(e) =>
											onFieldChange({
												cntrRdg: normalizeMileage(e.target.value),
											})
										}
										className={cn(
											"bg-[#161618] border-white/5 h-9 text-xs rounded-lg px-3 transition-all",
											getFieldError("cntrRdg") &&
												"border-red-500/50 ring-1 ring-red-500/20",
											glowClass,
										)}
									/>
									{getFieldError("cntrRdg") && (
										<p className="text-[9px] text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1 leading-tight">
											{errors.cntrRdg ?? "KM reading is required"}
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
										onChange={(e) => onFieldChange({ mobile: e.target.value })}
										className={cn(
											"bg-[#161618] border-white/5 h-9 text-xs rounded-lg px-3 transition-all",
											getFieldError("mobile") &&
												"border-red-500/50 ring-1 ring-red-500/20",
											glowClass,
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
											onFieldChange({ acceptedBy: e.target.value })
										}
										className={cn(
											"bg-[#161618] border-white/5 h-9 text-xs rounded-lg px-3 transition-all",
											getFieldError("acceptedBy") &&
												"border-red-500/50 ring-1 ring-red-500/20",
											glowClass,
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
											onFieldChange({ sabNumber: e.target.value })
										}
										className={cn(
											"bg-[#161618] border-white/5 h-9 text-xs rounded-lg px-3 transition-all",
											getFieldError("sabNumber") &&
												"border-red-500/50 ring-1 ring-red-500/20",
											glowClass,
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
											getFieldError("model") && "ring-2 ring-red-500/50",
											glowClass,
										)}
									>
										<EditableSelect
											options={models}
											value={formData.model}
											onChange={(val) => onFieldChange({ model: val })}
											onAdd={(option) => {
												if (!settingsLoading && !models.includes(option)) {
													updateAppSettings.mutate({
														models: [...models, option],
													});
												}
											}}
											onRemove={(option) => {
												if (!settingsLoading) {
													updateAppSettings.mutate({
														models: models.filter((m) => m !== option),
													});
												}
											}}
											placeholder="Select model..."
										/>
									</div>
									{getFieldError("model") && (
										<p className="text-[9px] text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
											{errors.model ?? "Vehicle model is required"}
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
											getFieldError("repairSystem") && "ring-2 ring-red-500/50",
											glowClass,
										)}
									>
										<EditableSelect
											options={repairSystems}
											value={formData.repairSystem}
											onChange={(val) => {
												if (val === "ضمان") {
													onFieldChange({
														repairSystem: val,
														startWarranty:
															formData.startWarranty ||
															new Date().toISOString().split("T")[0],
													});
												} else {
													onFieldChange({
														repairSystem: val,
														startWarranty: "",
													});
												}
											}}
											onAdd={(option) => {
												if (
													!settingsLoading &&
													!repairSystems.includes(option)
												) {
													updateAppSettings.mutate({
														repairSystems: [...repairSystems, option],
													});
												}
											}}
											onRemove={(option) => {
												if (!settingsLoading) {
													updateAppSettings.mutate({
														repairSystems: repairSystems.filter(
															(s) => s !== option,
														),
													});
												}
											}}
											placeholder="Select repair system"
											protectedOptions={["ضمان"]}
										/>
									</div>
									{getFieldError("repairSystem") && (
										<p className="text-[9px] text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
											{errors.repairSystem ?? "Repair system is required"}
										</p>
									)}
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
														onFieldChange({ startWarranty: val })
													}
													className={glowClass}
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
	);
};
