"use client";

import { Search as SearchIcon } from "lucide-react";
import { ArchiveReasonModal } from "@/components/shared/ArchiveReasonModal";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MoveToMainConfirmDialog } from "@/components/shared/MoveToMainConfirmDialog";
import { useSearchResultsState } from "@/components/shared/search/hooks/useSearchResultsState";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/hooks/useT";
import { FOCUS_CHAMPAGNE_VISIBLE } from "@/lib/focusStyles";
import { cn } from "@/lib/utils";
import { RowModals } from "./RowModals";
import { SearchResultsGrid } from "./search/SearchResultsGrid";
import { SearchResultsHeader } from "./search/SearchResultsHeader";
import { SearchToolbar } from "./search/SearchToolbar";

export const SearchResultsView = () => {
	const { t } = useT();
	const {
		searchTerm,
		setSearchTerm,
		selectedRows,
		showFilters,
		setShowFilters,
		showBookingModal,
		setShowBookingModal,
		showArchiveModal,
		setShowArchiveModal,
		showDeleteConfirm,
		setShowDeleteConfirm,
		isSameSource,
		disabledReason,
		filteredResults,
		sourceOptions,
		activeSourceFilter,
		handleSourceFilterChange,
		availableCompanies,
		selectedCompanies,
		handleCompanyFilterChange,
		handleCompanyFilterClear,
		modelOptions,
		selectedModels,
		setSelectedModels,
		counts,
		columns,
		partStatuses,
		handleReserve,
		handleBookingConfirm,
		handleArchiveConfirm,
		handleSendToCallList,
		handleReorderConfirm,
		showReorderModal,
		setShowReorderModal,
		reorderReason,
		setReorderReason,
		moveToMainPermission,
		isMoveToMainEligible,
		showMoveToMainModal,
		setShowMoveToMainModal,
		handleMoveToMainConfirm,
		handleDeleteConfirm,
		handleBulkStatusUpdate,
		handleExtract,
		onBadgeNavigate,
		onCellValueChanged,
		handleSelectionChanged,
		handleGridApiReady,
		handleDisplayedRowsChanged,
		handleGridPreDestroyed,
		activeModal,
		currentRow,
		closeModal,
		saveNote,
		saveReminder,
		saveAttachment,
		saveArchive,
		sourceTag,
	} = useSearchResultsState();

	if (!searchTerm) return null;

	return (
		<div className="flex flex-col h-full bg-[#0a0a0b] text-white">
			<SearchResultsHeader
				searchTerm={searchTerm}
				resultsCount={filteredResults.length}
				counts={counts}
				selectedCount={selectedRows.length}
				onClearSearch={() => setSearchTerm("")}
				onBadgeClick={onBadgeNavigate}
			/>

			<SearchToolbar
				selectedCount={selectedRows.length}
				isSameSource={isSameSource}
				disabledReason={disabledReason}
				onBooking={() => setShowBookingModal(true)}
				onArchive={() => setShowArchiveModal(true)}
				onSendToCallList={handleSendToCallList}
				onReorder={() => setShowReorderModal(true)}
				onMoveToMain={() => setShowMoveToMainModal(true)}
				canMoveToMain={moveToMainPermission}
				isMoveToMainEligible={isMoveToMainEligible}
				onDelete={() => setShowDeleteConfirm(true)}
				onExtract={handleExtract}
				onFilterToggle={() => setShowFilters((v) => !v)}
				onReserve={handleReserve}
				onUpdateStatus={handleBulkStatusUpdate}
				partStatuses={partStatuses}
				showFilters={showFilters}
				modelOptions={modelOptions}
				selectedModels={selectedModels}
				onModelsChange={setSelectedModels}
				sourceOptions={sourceOptions}
				activeSourceFilter={activeSourceFilter}
				onSourceFilterChange={handleSourceFilterChange}
				availableCompanies={availableCompanies}
				selectedCompanies={selectedCompanies}
				onCompanyFilterChange={handleCompanyFilterChange}
				onCompanyFilterClear={handleCompanyFilterClear}
			/>

			<div className="flex-1 p-6 overflow-hidden">
				{/*
				 * `filteredResults` can only be empty when `searchResults` is too:
				 * (1) `effectiveSourceFilter` is a render-time intersection with
				 * `sourceOptions`, so a selected source can never yield 0 rows on its
				 * own; if absent from current results, the filter self-heals to null.
				 * (2) `availableCompanies` is likewise a render-time intersection
				 * against `sourceFilteredResults`, so a selected company can never
				 * yield 0 rows on its own either.
				 * (3) `modelOptions` are derived from `companyFilteredResults`, so any
				 * selected model is guaranteed to match at least one row within the
				 * selected source and company, and clearing selection falls back
				 * unchanged.
				 * A single guard on `filteredResults.length` covers all cases.
				 */}
				{filteredResults.length > 0 ? (
					<SearchResultsGrid
						rowData={filteredResults}
						columnDefs={columns}
						onCellValueChanged={onCellValueChanged}
						onSelectionChanged={handleSelectionChanged}
						onGridApiReady={handleGridApiReady}
						onDisplayedRowsChanged={handleDisplayedRowsChanged}
						onGridPreDestroyed={handleGridPreDestroyed}
						showFilters={showFilters}
					/>
				) : (
					<div className="flex flex-col items-center justify-center h-full text-center space-y-4">
						<div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
							<SearchIcon className="w-8 h-8 text-gray-600" />
						</div>
						<div>
							<h3 className="text-lg font-medium text-white/80">
								No results found
							</h3>
							<p className="text-sm text-gray-500 mt-1 max-w-xs">
								We couldn't find any records matching "{searchTerm}".
							</p>
						</div>
						<Button
							onClick={() => setSearchTerm("")}
							variant="outline"
							className="mt-4 border-white/10 hover:bg-white/5"
						>
							Clear Search Input
						</Button>
					</div>
				)}
			</div>

			{/* Modals */}
			<BookingCalendarModal
				open={showBookingModal}
				onOpenChange={setShowBookingModal}
				onConfirm={handleBookingConfirm}
				selectedRows={selectedRows}
			/>
			<ArchiveReasonModal
				open={showArchiveModal}
				onOpenChange={setShowArchiveModal}
				onSave={handleArchiveConfirm}
			/>
			<ConfirmDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				onConfirm={handleDeleteConfirm}
				title={t("modals.stageConfirm.searchDeleteTitle")}
				description={t("modals.stageConfirm.searchDeleteDescription", {
					count: selectedRows.length,
				})}
			/>

			<MoveToMainConfirmDialog
				open={showMoveToMainModal}
				onOpenChange={setShowMoveToMainModal}
				count={selectedRows.length}
				onConfirm={handleMoveToMainConfirm}
			/>

			{/* Reorder Reason Modal */}
			<Dialog
				open={showReorderModal}
				onOpenChange={(open) => {
					setShowReorderModal(open);
					if (!open) setReorderReason("");
				}}
			>
				<DialogContent className="bg-[#1c1c1e] border border-white/10 text-white">
					<DialogHeader>
						<DialogTitle className="text-orange-500">
							Reorder - Reason Required
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>Reason for Reorder</Label>
							<Input
								value={reorderReason}
								onChange={(e) => setReorderReason(e.target.value)}
								placeholder="e.g., Customer called back, error on main sheet"
								className={cn(
									FOCUS_CHAMPAGNE_VISIBLE,
									"bg-white/5 border-white/10 text-white",
								)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowReorderModal(false);
								setReorderReason("");
							}}
							className="border-white/20 text-white hover:bg-white/10"
						>
							Cancel
						</Button>
						<Button
							variant="renault"
							onClick={handleReorderConfirm}
							disabled={!reorderReason.trim()}
						>
							Confirm Reorder
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<RowModals
				activeModal={activeModal}
				currentRow={currentRow}
				onClose={closeModal}
				onSaveNote={saveNote}
				onSaveReminder={saveReminder}
				onSaveAttachment={saveAttachment}
				onSaveArchive={saveArchive}
				sourceTag={sourceTag}
			/>
		</div>
	);
};
