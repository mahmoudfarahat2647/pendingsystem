"use client";

import { useState } from "react";

export function useBookingModals() {
	const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
	const [reorderReason, setReorderReason] = useState("");
	const [isRebookingModalOpen, setIsRebookingModalOpen] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showMoveToMainConfirm, setShowMoveToMainConfirm] = useState(false);

	return {
		// reorder
		isReorderModalOpen,
		setReorderModalOpen: setIsReorderModalOpen,
		openReorder: () => setIsReorderModalOpen(true),
		closeReorder: () => setIsReorderModalOpen(false),
		reorderReason,
		setReorderReason,
		resetReorder: () => {
			setIsReorderModalOpen(false);
			setReorderReason("");
		},
		// rebooking
		isRebookingModalOpen,
		setRebookingModalOpen: setIsRebookingModalOpen,
		openRebooking: () => setIsRebookingModalOpen(true),
		closeRebooking: () => setIsRebookingModalOpen(false),
		// delete
		showDeleteConfirm,
		setShowDeleteConfirm,
		openDeleteConfirm: () => setShowDeleteConfirm(true),
		closeDeleteConfirm: () => setShowDeleteConfirm(false),
		// move to main sheet
		showMoveToMainConfirm,
		setShowMoveToMainConfirm,
		openMoveToMainConfirm: () => setShowMoveToMainConfirm(true),
		closeMoveToMainConfirm: () => setShowMoveToMainConfirm(false),
	};
}
