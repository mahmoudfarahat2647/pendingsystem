"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LocalizedScope } from "@/components/shared/LocalizedScope";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	useAddEmailRecipientMutation,
	useRemoveEmailRecipientMutation,
	useReportSettingsQuery,
} from "@/hooks/queries/reports/useReportSettingsQuery";
import { useT } from "@/hooks/useT";

interface RecipientsCardProps {
	isLocked: boolean;
}

export function RecipientsCard({ isLocked }: RecipientsCardProps) {
	const { data: reportSettings } = useReportSettingsQuery();
	const addEmailRecipientMutation = useAddEmailRecipientMutation();
	const removeEmailRecipientMutation = useRemoveEmailRecipientMutation();
	const [emailInput, setEmailInput] = useState("");
	const { t, lang } = useT();

	const isLoading = !reportSettings;

	const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const handleAddEmail = () => {
		if (EMAIL_RE.test(emailInput.trim())) {
			addEmailRecipientMutation.mutate(emailInput.trim());
			setEmailInput("");
		} else if (emailInput.trim()) {
			toast.error("Please enter a valid email address");
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleAddEmail();
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<LocalizedScope lang={lang}>
						{t("settings.reports.recipientsTitle")}
					</LocalizedScope>
				</CardTitle>
				<CardDescription>
					<LocalizedScope lang={lang}>
						{t("settings.reports.recipientsDescription")}
					</LocalizedScope>
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex w-full max-w-sm items-center space-x-2">
					<Input
						type="email"
						placeholder={t("settings.reports.emailPlaceholder")}
						value={emailInput}
						onChange={(e) => setEmailInput(e.target.value)}
						onKeyDown={handleKeyDown}
						disabled={isLoading || isLocked}
					/>
					<Button
						type="button"
						onClick={handleAddEmail}
						size="icon"
						aria-label={t("settings.reports.addEmailRecipient")}
						disabled={isLoading || isLocked}
					>
						<Plus className="h-4 w-4" />
						<span className="sr-only">{t("settings.reports.addEmail")}</span>
					</Button>
				</div>

				<div className="flex flex-wrap gap-2">
					{reportSettings?.emails && reportSettings.emails.length > 0 ? (
						reportSettings.emails.map((email) => (
							<Badge key={email} variant="secondary" className="px-3 py-1">
								{email}
								<button
									type="button"
									className="ml-2 ring-offset-background transition-colors hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full disabled:opacity-50"
									onClick={() => removeEmailRecipientMutation.mutate(email)}
									aria-label={t("settings.reports.removeRecipient", { email })}
									disabled={isLocked}
								>
									<X className="h-3 w-3" />
									<span className="sr-only">
										{t("settings.reports.removeRecipient", { email })}
									</span>
								</button>
							</Badge>
						))
					) : (
						<p className="text-sm text-muted-foreground italic">
							<LocalizedScope lang={lang}>
								{t("settings.reports.noRecipients")}
							</LocalizedScope>
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
