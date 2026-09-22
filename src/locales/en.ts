import type { TranslationCatalog } from "./types";

export const en: TranslationCatalog = {
	common: {
		languageEnglish: "English",
		languageArabic: "العربية",
	},
	nav: {
		dashboard: "Dashboard",
		orders: "Orders",
		mainSheet: "Main Sheet",
		call: "Call",
		booking: "Booking",
		archive: "Archive",
		freeze: "Freeze",
		reports: "Reports",
	},
	shell: {
		searchPlaceholder: "Search system (Cmd+K)...",
	},
	settings: {
		title: "Settings",
		language: {
			navLabel: "Language",
			sectionTitle: "Language",
			sectionDescription:
				"Choose the interface language. This changes immediately and is remembered on this browser.",
			english: "English",
			arabic: "العربية",
		},
	},
	validation: {
		customerNameRequired: "Customer name is required",
		vinRequired: "VIN is required",
		mobileRequired: "Mobile number is required",
		invalidMileageFormat: "Invalid mileage format",
		companyRequired: "Company is required",
		invalidCompany: "Invalid company. Only Zeekr and Renault are allowed",
		warrantyMileageExceeded:
			"Ineligible for Warranty: Vehicle exceeds 100,000 KM",
		kmReadingRequired: "KM reading is required",
		vehicleModelRequired: "Vehicle model is required",
		repairSystemRequired: "Repair system is required",
		sabNumberRequired: "SAB Number is required",
		requesterRequired: "Branch/Requester is required",
		acceptedByRequired: "Agent name is required",
		generic: "Please check this field.",
	},
	toast: {
		identityFieldsUpdated: "Identity fields updated",
		beastModeMissingInfo:
			"Missing Info: Please complete the highlighted fields.",
		duplicatePartNumbersRemove:
			"Duplicate part numbers in this order. Please remove duplicates.",
		vinPartDuplicateReview:
			"This VIN + part combination already exists. Please review.",
		descriptionConflictResolve:
			"Description conflicts must be resolved. Please use the existing description.",
		beastModePartRequired:
			"Part number and description are required. Please complete the components section.",
		duplicateCheckFailed:
			"Could not verify duplicate parts. Please try submitting again.",
		draftSaveSuccess: "Draft saved successfully.",
		draftSaveFailed: "Draft save failed. Please try again.",
		saveFailedPrefix: "Save failed:",
		skipThisChange: "Skip this change",
		saveOrderErrorPrefix: "Error saving order:",
		moveOrdersErrorPrefix: "Failed to move orders:",
		deleteOrdersErrorPrefix: "Failed to delete orders:",
	},
	warnings: {
		duplicatePartInOrder: "Duplicate part number in this order",
		orderAlreadyExists: "The order already exists",
		orderAlreadyExistsDb: "The order already exists (DB)",
		inLocationConnector: "in",
		existingNameLabel: "Existing Name:",
	},
};
