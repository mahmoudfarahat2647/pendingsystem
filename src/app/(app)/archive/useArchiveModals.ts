"use client";

import { useState } from "react";

export function useArchiveModals() {
	const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
	const [reorderReason, setReorderReason] = useState("");
	const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
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
		// booking calendar modal
		isBookingModalOpen,
		setBookingModalOpen: setIsBookingModalOpen,
		openBooking: () => setIsBookingModalOpen(true),
		closeBooking: () => setIsBookingModalOpen(false),
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
