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
	 * Translated labels for built-in statuses, used only by the status label
	 * presentation rule (`src/lib/locale/statusLabel.ts`, issue #269) — never
	 * applied to a status an operator has renamed or created. See
	 * `src/domain/status/statusDefaults.ts` for the canonical default labels
	 * these keys correspond to.
	 */
	statuses: {
		partStatus: {
			noStats: string;
			hold: string;
			reserve: string;
			branch: string;
			arrive: string;
		};
		bookingStatus: {
			confirmed: string;
			pending: string;
			cancelled: string;
			completed: string;
		};
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
