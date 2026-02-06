"use client";

import {
	Archive,
	Calendar,
	ChevronLeft,
	ChevronRight,
	FileSpreadsheet,
	LayoutDashboard,
	LogOut,
	MoreVertical,
	Phone,
	ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { SettingsModal } from "./SettingsModal";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
	href: string;
	label: string;
	icon: React.ReactNode;
	badge?: number;
}

const navItems: NavItem[] = [
	{
		href: "/",
		label: "Dashboard",
		icon: <LayoutDashboard className="h-5 w-5" />,
	},
	{
		href: "/orders",
		label: "Orders",
		icon: <ShoppingCart className="h-5 w-5" />,
	},
	{
		href: "/main-sheet",
		label: "Main Sheet",
		icon: <FileSpreadsheet className="h-5 w-5" />,
	},
	{
		href: "/call-list",
		label: "Call",
		icon: <Phone className="h-5 w-5" />,
	},
	{
		href: "/booking",
		label: "Booking",
		icon: <Calendar className="h-5 w-5" />,
	},
	{
		href: "/archive",
		label: "Archive",
		icon: <Archive className="h-5 w-5" />,
	},
];

export const Sidebar = React.memo(function Sidebar() {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const pathname = usePathname();
	const { logout } = useAuth();

	const handleLogout = async () => {
		await logout();
	};

	return (
		<aside
			suppressHydrationWarning
			className={cn(
				"flex flex-col border-r transition-all duration-300 z-50",
				"bg-black/80 backdrop-blur-md border-white/10",
				isCollapsed ? "w-20" : "w-72",
			)}
		>
			{/* Logo */}
			<div className="flex items-center h-20 px-6 border-b border-white/10">
				{!isCollapsed ? (
					<div className="flex flex-col">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-renault-yellow rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,204,0,0.3)]">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 32 32"
									className="w-6 h-6"
									role="img"
									aria-label="pendingsystem Logo"
								>
									<g transform="translate(16, 16)">
										<rect
											x="-8"
											y="-13"
											width="4.5"
											height="26"
											rx="2.25"
											fill="#000000"
											transform="rotate(-8)"
										/>
										<rect
											x="3.5"
											y="-13"
											width="4.5"
											height="26"
											rx="2.25"
											fill="#000000"
											transform="rotate(-8)"
										/>
										<rect
											x="-13"
											y="-6.25"
											width="26"
											height="4.5"
											rx="2.25"
											fill="#000000"
											transform="rotate(-8)"
										/>
										<rect
											x="-13"
											y="1.75"
											width="26"
											height="4.5"
											rx="2.25"
											fill="#000000"
											transform="rotate(-8)"
										/>
									</g>
								</svg>
							</div>
							<div className="flex flex-col">
								<span className="font-bold text-white tracking-wide text-lg leading-none">
									BODY&PAINT
								</span>
								<span className="text-renault-yellow font-medium text-xs tracking-[0.2em] leading-none mt-1">
									pending system
								</span>
							</div>
						</div>
					</div>
				) : (
					<div className="w-full flex justify-center">
						<div className="w-10 h-10 bg-renault-yellow rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,204,0,0.3)]">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 32 32"
								className="w-6 h-6"
								role="img"
								aria-label="pendingsystem Logo"
							>
								<g transform="translate(16, 16)">
									<rect
										x="-8"
										y="-13"
										width="4.5"
										height="26"
										rx="2.25"
										fill="#000000"
										transform="rotate(-8)"
									/>
									<rect
										x="3.5"
										y="-13"
										width="4.5"
										height="26"
										rx="2.25"
										fill="#000000"
										transform="rotate(-8)"
									/>
									<rect
										x="-13"
										y="-6.25"
										width="26"
										height="4.5"
										rx="2.25"
										fill="#000000"
										transform="rotate(-8)"
									/>
									<rect
										x="-13"
										y="1.75"
										width="26"
										height="4.5"
										rx="2.25"
										fill="#000000"
										transform="rotate(-8)"
									/>
								</g>
							</svg>
						</div>
					</div>
				)}
			</div>

			{/* Navigation */}
			<nav className="flex-1 py-8 overflow-y-auto" suppressHydrationWarning>
				<ul className="space-y-2 px-4" suppressHydrationWarning>
					{navItems.map((item) => {
						const isActive = pathname === item.href;
						return (
							<li key={item.href} suppressHydrationWarning>
								<Link
									href={item.href}
									suppressHydrationWarning
									className={cn(
										"flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
										isActive
											? "bg-renault-yellow text-black font-bold shadow-[0_0_20px_rgba(255,204,0,0.2)]"
											: "text-gray-400 hover:text-white hover:bg-white/5",
										isCollapsed && "justify-center px-2",
									)}
									title={isCollapsed ? item.label : undefined}
								>
									{/* Icon */}
									<div
										className={cn(
											"relative z-10 transition-transform duration-200",
											isActive ? "scale-110" : "group-hover:scale-110",
										)}
									>
										{item.icon}
									</div>

									{/* Label */}
									{!isCollapsed && (
										<span className="relative z-10 text-sm tracking-wide" suppressHydrationWarning>
											{item.label}
										</span>
									)}

									{/* Badge */}
									{!isCollapsed && item.badge !== undefined && (
										<span
											className={cn(
												"ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border relative z-10",
												isActive
													? "bg-black/20 border-black/10 text-black"
													: "bg-renault-yellow/10 border-renault-yellow/20 text-renault-yellow",
											)}
										>
											{item.badge}
										</span>
									)}
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>

			{/* Collapse Button */}
			<button
				type="button"
				suppressHydrationWarning
				onClick={() => setIsCollapsed(!isCollapsed)}
				className="flex items-center justify-center h-12 mx-4 mb-4 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors border border-transparent hover:border-white/10"
			>
				{isCollapsed ? (
					<ChevronRight className="h-5 w-5" />
				) : (
					<ChevronLeft className="h-5 w-5" />
				)}
			</button>

			{/* User Profile */}
			<div className="border-t border-white/10 p-4 bg-black/20" suppressHydrationWarning>
				<div className="w-full flex items-center gap-2">
					<button
						type="button"
						suppressHydrationWarning
						onClick={() => setSettingsOpen(true)}
						className={cn(
							"flex-1 flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all text-left",
							isCollapsed && "justify-center",
						)}
					>
						<div
							suppressHydrationWarning
							className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center relative flex-shrink-0"
						>
							<div
								suppressHydrationWarning
								className="absolute inset-0 rounded-full bg-renault-yellow/10 animate-pulse"
							></div>
							<span className="text-xs font-bold text-renault-yellow">MF</span>
							<div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full"></div>
						</div>
						{!isCollapsed && (
							<div className="flex-1 min-w-0">
								<p className="text-sm font-semibold text-white truncate" suppressHydrationWarning>
									Mahmoud Farahat
								</p>
								<p className="text-xs text-gray-500 truncate" suppressHydrationWarning>System Creator</p>
							</div>
						)}
					</button>
					{!isCollapsed && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
									aria-label="User menu"
								>
									<MoreVertical className="h-4 w-4" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								side="top"
								align="end"
								className="bg-black/95 border-white/10 backdrop-blur-md"
							>
								<DropdownMenuItem
									onClick={handleLogout}
									className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
								>
									<LogOut className="mr-2 h-4 w-4" />
									<span>Logout</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>

			<SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
		</aside>
	);
});
