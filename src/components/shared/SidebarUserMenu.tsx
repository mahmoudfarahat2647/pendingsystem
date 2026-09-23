"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { LocalizedScope } from "@/components/shared/LocalizedScope";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/hooks/useT";
import { authClient } from "@/lib/auth-client";

interface SidebarUserMenuProps {
	trigger: React.ReactNode;
}

export function SidebarUserMenu({ trigger }: SidebarUserMenuProps) {
	const router = useRouter();
	const { t, lang } = useT();

	const handleSignOut = async () => {
		await authClient.signOut();
		router.replace("/login");
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="bg-[#0c0c0e] border-white/10 text-slate-200"
			>
				<DropdownMenuItem
					onClick={handleSignOut}
					className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10"
				>
					<LogOut className="h-4 w-4 mr-2" />
					<LocalizedScope lang={lang}>{t("sidebar.signOut")}</LocalizedScope>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
