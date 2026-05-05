"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAppSettingsQuery } from "@/hooks/queries/useAppSettingsQuery";
import { ALLOWED_COMPANIES } from "@/lib/ordersValidationConstants";
import type { MobileQuickOrderPayload } from "@/schemas/mobileOrder.schema";

interface PartRow {
	id: string;
	partNumber: string;
	description: string;
}

function makeBlankPart(): PartRow {
	return { id: crypto.randomUUID(), partNumber: "", description: "" };
}

const initialState = {
	customerName: "",
	company: "" as string,
	vin: "",
	mobile: "",
	sabNumber: "",
	model: "",
	repairSystem: "",
};

export default function MobileOrderPage() {
	const { data: settings } = useAppSettingsQuery();
	const models = settings?.models ?? [];
	const repairSystems = settings?.repairSystems ?? [];

	const [fields, setFields] = useState(initialState);
	const [parts, setParts] = useState<PartRow[]>([makeBlankPart()]);
	const [submitting, setSubmitting] = useState(false);
	const [customModel, setCustomModel] = useState("");
	const [customRepair, setCustomRepair] = useState("");

	function setField(key: keyof typeof fields, value: string) {
		setFields((f) => ({ ...f, [key]: value }));
	}

	function updatePart(
		id: string,
		key: "partNumber" | "description",
		value: string,
	) {
		setParts((ps) => ps.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
	}

	function addPart() {
		setParts((ps) => [...ps, makeBlankPart()]);
	}

	function removePart(id: string) {
		setParts((ps) => (ps.length > 1 ? ps.filter((p) => p.id !== id) : ps));
	}

	function resetForm() {
		setFields(initialState);
		setParts([makeBlankPart()]);
		setCustomModel("");
		setCustomRepair("");
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!fields.company) {
			toast.error("Please select a company.");
			return;
		}

		const resolvedModel =
			fields.model === "__custom__" ? customModel.trim() : fields.model;
		const resolvedRepair =
			fields.repairSystem === "__custom__"
				? customRepair.trim()
				: fields.repairSystem;

		const payload: Omit<MobileQuickOrderPayload, "parts"> & {
			parts: { partNumber: string; description: string }[];
		} = {
			customerName: fields.customerName,
			company: fields.company,
			vin: fields.vin,
			mobile: fields.mobile,
			sabNumber: fields.sabNumber,
			model: resolvedModel,
			repairSystem: resolvedRepair,
			parts: parts.map(({ partNumber, description }) => ({
				partNumber,
				description,
			})),
		};

		setSubmitting(true);
		try {
			const res = await fetch("/api/mobile-order", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				toast.error(err.error ?? "Submission failed. Please try again.");
				return;
			}
			toast.success("Order submitted successfully!");
			resetForm();
		} catch {
			toast.error("Network error. Please try again.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="min-h-screen bg-background px-4 py-6 max-w-lg mx-auto">
			<h1 className="text-xl font-semibold mb-6">Quick Order</h1>
			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Company — required */}
				<div className="space-y-1">
					<label className="text-sm font-medium" htmlFor="company">
						Company <span className="text-destructive">*</span>
					</label>
					<select
						id="company"
						value={fields.company}
						onChange={(e) => setField("company", e.target.value)}
						className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						required
					>
						<option value="" disabled>
							Select company…
						</option>
						{ALLOWED_COMPANIES.map((c) => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</select>
				</div>

				{/* Customer */}
				<div className="space-y-1">
					<label className="text-sm font-medium" htmlFor="customerName">
						Customer
					</label>
					<input
						id="customerName"
						type="text"
						value={fields.customerName}
						onChange={(e) => setField("customerName", e.target.value)}
						className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						placeholder="Customer name"
					/>
				</div>

				{/* Mobile */}
				<div className="space-y-1">
					<label className="text-sm font-medium" htmlFor="mobile">
						Mobile
					</label>
					<input
						id="mobile"
						type="tel"
						value={fields.mobile}
						onChange={(e) => setField("mobile", e.target.value)}
						className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						placeholder="Phone number"
					/>
				</div>

				{/* VIN */}
				<div className="space-y-1">
					<label className="text-sm font-medium" htmlFor="vin">
						VIN
					</label>
					<input
						id="vin"
						type="text"
						value={fields.vin}
						onChange={(e) => setField("vin", e.target.value)}
						className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						placeholder="Vehicle identification number"
					/>
				</div>

				{/* SAB */}
				<div className="space-y-1">
					<label className="text-sm font-medium" htmlFor="sabNumber">
						SAB
					</label>
					<input
						id="sabNumber"
						type="text"
						value={fields.sabNumber}
						onChange={(e) => setField("sabNumber", e.target.value)}
						className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						placeholder="SAB number"
					/>
				</div>

				{/* Vehicle Model */}
				<div className="space-y-1">
					<label className="text-sm font-medium" htmlFor="model">
						Vehicle Model
					</label>
					<select
						id="model"
						value={fields.model}
						onChange={(e) => setField("model", e.target.value)}
						className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					>
						<option value="">Select model…</option>
						{models.map((m) => (
							<option key={m} value={m}>
								{m}
							</option>
						))}
						<option value="__custom__">Other (type below)</option>
					</select>
					{fields.model === "__custom__" && (
						<input
							type="text"
							value={customModel}
							onChange={(e) => setCustomModel(e.target.value)}
							className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							placeholder="Enter model name"
						/>
					)}
				</div>

				{/* Repair System */}
				<div className="space-y-1">
					<label className="text-sm font-medium" htmlFor="repairSystem">
						Repair System
					</label>
					<select
						id="repairSystem"
						value={fields.repairSystem}
						onChange={(e) => setField("repairSystem", e.target.value)}
						className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					>
						<option value="">Select system…</option>
						{repairSystems.map((r) => (
							<option key={r} value={r}>
								{r}
							</option>
						))}
						<option value="__custom__">Other (type below)</option>
					</select>
					{fields.repairSystem === "__custom__" && (
						<input
							type="text"
							value={customRepair}
							onChange={(e) => setCustomRepair(e.target.value)}
							className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							placeholder="Enter repair system"
						/>
					)}
				</div>

				{/* Parts */}
				<div className="space-y-2">
					<p className="text-sm font-medium">Parts</p>
					{parts.map((part, i) => (
						<div key={part.id} className="flex gap-2 items-start">
							<input
								type="text"
								value={part.partNumber}
								onChange={(e) =>
									updatePart(part.id, "partNumber", e.target.value)
								}
								className="w-1/3 rounded-md border border-input bg-background px-3 py-2 text-sm"
								placeholder="Part #"
							/>
							<input
								type="text"
								value={part.description}
								onChange={(e) =>
									updatePart(part.id, "description", e.target.value)
								}
								className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
								placeholder="Description"
							/>
							<button
								type="button"
								onClick={() => removePart(part.id)}
								disabled={parts.length === 1}
								className="px-2 py-2 text-sm text-muted-foreground disabled:opacity-30"
								aria-label={`Remove part ${i + 1}`}
							>
								✕
							</button>
						</div>
					))}
					<button
						type="button"
						onClick={addPart}
						className="text-sm text-primary underline-offset-2 hover:underline"
					>
						+ Add part
					</button>
				</div>

				<button
					type="submit"
					disabled={submitting}
					className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium disabled:opacity-60"
				>
					{submitting ? "Submitting…" : "Submit Order"}
				</button>
			</form>
		</div>
	);
}
