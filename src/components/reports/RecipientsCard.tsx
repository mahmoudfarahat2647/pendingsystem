"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
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
import { useAppStore } from "@/store/useStore";

interface RecipientsCardProps {
	isLocked: boolean;
}

export function RecipientsCard({ isLocked }: Readonly<RecipientsCardProps>) {
	const { reportSettings, addEmailRecipient, removeEmailRecipient } =
		useAppStore();
	const [emailInput, setEmailInput] = useState("");

	const isLoading = !reportSettings;

	const handleAddEmail = () => {
		if (emailInput?.includes("@")) {
			addEmailRecipient(emailInput);
			setEmailInput("");
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
				<CardTitle>Recipients</CardTitle>
				<CardDescription>
					Manage who receives the automated reports suitable for backup.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex w-full max-w-sm items-center space-x-2">
					<Input
						type="email"
						placeholder="Email address"
						value={emailInput}
						onChange={(e) => setEmailInput(e.target.value)}
						onKeyDown={handleKeyDown}
						disabled={isLoading || isLocked}
					/>
					<Button
						type="button"
						onClick={handleAddEmail}
						size="icon"
						disabled={isLoading || isLocked}
					>
						<Plus className="h-4 w-4" />
						<span className="sr-only">Add Email</span>
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
									onClick={() => removeEmailRecipient(email)}
									disabled={isLocked}
								>
									<X className="h-3 w-3" />
									<span className="sr-only">Remove {email}</span>
								</button>
							</Badge>
						))
					) : (
						<p className="text-sm text-muted-foreground italic">
							No recipients added yet.
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
