/**
 * Translation catalog shape and the dotted-path key type derived from it.
 *
 * Every supported locale's catalog file must satisfy `TranslationCatalog`
 * exactly: TypeScript's excess-property checking on a literal assigned to a
 * typed variable means a catalog missing a key, or adding one the type does
 * not declare, fails `npm run type-check` (see CLAUDE.md's locale
 * type-alignment requirement).
 *
 * Scope note: this ticket (#263) is the locale *foundation* — it only wires
 * up enough surface (Settings language section, sidebar/nav labels, one
 * representative shell string) to prove the mechanism end-to-end. Full
 * product coverage is later wave tickets under #255.
 */
export interface TranslationCatalog {
	common: {
		languageEnglish: string;
		languageArabic: string;
	};
	nav: {
		dashboard: string;
		orders: string;
		mainSheet: string;
		call: string;
		booking: string;
		archive: string;
		freeze: string;
		reports: string;
	};
	shell: {
		searchPlaceholder: string;
	};
	settings: {
		title: string;
		language: {
			navLabel: string;
			sectionTitle: string;
			sectionDescription: string;
			english: string;
			arabic: string;
		};
	};
	/**
	 * Presentation-boundary copy for `OrderFormSchema`/`BeastModeSchema` (see
	 * `src/schemas/form.schema.ts`). The schemas themselves stay locale-agnostic
	 * — their canonical English messages are the "structured error identity"
	 * that `src/locales/validationMessages.ts` maps to these keys. `generic` is
	 * the fallback for any message the mapping does not recognize (#268).
	 */
	validation: {
		customerNameRequired: string;
		vinRequired: string;
		mobileRequired: string;
		invalidMileageFormat: string;
		companyRequired: string;
		invalidCompany: string;
		warrantyMileageExceeded: string;
		kmReadingRequired: string;
		vehicleModelRequired: string;
		repairSystemRequired: string;
		sabNumberRequired: string;
		requesterRequired: string;
		acceptedByRequired: string;
		generic: string;
	};
	/**
	 * Product-owned toast copy and action labels (#268). Operational data
	 * embedded in a toast (a raw error message, a VIN, a part number) is never
	 * a catalog key — only the surrounding static copy is.
	 */
	toast: {
		identityFieldsUpdated: string;
		beastModeMissingInfo: string;
		duplicatePartNumbersRemove: string;
		vinPartDuplicateReview: string;
		descriptionConflictResolve: string;
		beastModePartRequired: string;
		duplicateCheckFailed: string;
		draftSaveSuccess: string;
		draftSaveFailed: string;
		saveFailedPrefix: string;
		skipThisChange: string;
		saveOrderErrorPrefix: string;
		moveOrdersErrorPrefix: string;
		deleteOrdersErrorPrefix: string;
	};
	/** Static copy inside the order form's part-level validation warnings. */
	warnings: {
		duplicatePartInOrder: string;
		orderAlreadyExists: string;
		orderAlreadyExistsDb: string;
		inLocationConnector: string;
		existingNameLabel: string;
	};
}

type Join<K extends string, P extends string> = P extends "" ? K : `${K}.${P}`;

type Paths<T> = T extends string
	? ""
	: {
			[K in Extract<keyof T, string>]: Join<K, Paths<T[K]>>;
		}[Extract<keyof T, string>];

/** Every valid dotted lookup path into `TranslationCatalog` (e.g. "nav.orders"). */
export type TranslationKey = Paths<TranslationCatalog>;
