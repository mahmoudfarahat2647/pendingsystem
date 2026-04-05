"use client";

import { Search as SearchIcon } from "lucide-react";
import { ArchiveReasonModal } from "@/components/shared/ArchiveReasonModal";
import { BookingCalendarModal } from "@/components/shared/BookingCalendarModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useSearchResultsState } from "@/components/shared/search/hooks/useSearchResultsState";
import { Button } from "@/components/ui/button";
import { RowModals } from "./RowModals";
import { SearchResultsGrid } from "./search/SearchResultsGrid";
import { SearchResultsHeader } from "./search/SearchResultsHeader";
import { SearchToolbar } from "./search/SearchToolbar";

export const SearchResultsView = () => {
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
		searchResults,
		counts,
		columns,
		partStatuses,
		handleReserve,
		handleBookingConfirm,
		handleArchiveConfirm,
		handleSendToCallList,
		handleDeleteConfirm,
		handleBulkStatusUpdate,
		handleExtract,
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
				resultsCount={searchResults.length}
				counts={counts}
				onClearSearch={() => setSearchTerm("")}
			/>

			<SearchToolbar
				selectedCount={selectedRows.length}
				isSameSource={isSameSource}
				disabledReason={disabledReason}
				onBooking={() => setShowBookingModal(true)}
				onArchive={() => setShowArchiveModal(true)}
				onSendToCallList={handleSendToCallList}
				onDelete={() => setShowDeleteConfirm(true)}
				onExtract={handleExtract}
				onFilterToggle={() => setShowFilters((v) => !v)}
				onReserve={handleReserve}
				onUpdateStatus={handleBulkStatusUpdate}
				partStatuses={partStatuses}
				showFilters={showFilters}
			/>

			<div className="flex-1 p-6 overflow-hidden">
				{searchResults.length > 0 ? (
					<SearchResultsGrid
						rowData={searchResults}
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
				title="Confirm Delete"
				description={`Are you sure you want to delete ${selectedRows.length} selected records? This action cannot be undone.`}
			/>

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
