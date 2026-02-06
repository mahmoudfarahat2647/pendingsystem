#!/usr/bin/env node
/**
 * Validates documentation consistency
 *
 * Checks:
 * - No broken internal links
 * - Code examples compile (syntax check)
 * - Required sections present
 * - Auto/manual section markers balanced
 */

const fs = require("node:fs");
const path = require("node:path");

const DOCS_DIR = path.join(__dirname, "..");
const REQUIRED_SECTIONS = {
	"README.md": ["Overview", "Quick Start", "Project Structure"],
	"FEATURES.md": ["System Feature Registry"],
	"ENGINEERING.md": ["Architecture", "Store API", "Components Guide", "Troubleshooting"],
};

const _AUTO_MARKERS = {
	START: "<!-- AUTO-GENERATED START",
	END: "<!-- AUTO-GENERATED END",
};

const _MANUAL_MARKERS = {
	START: "<!-- MANUAL START",
	END: "<!-- MANUAL END",
};

const errors = [];
const warnings = [];

function validateFile(filename) {
	const filePath = path.join(DOCS_DIR, filename);

	if (!fs.existsSync(filePath)) {
		errors.push(`❌ File missing: ${filename}`);
		return;
	}

	const content = fs.readFileSync(filePath, "utf-8");

	// Check required sections
	const requiredSections = REQUIRED_SECTIONS[filename] || [];
	requiredSections.forEach((section) => {
		if (!content.includes(section)) {
			errors.push(`❌ Missing section in ${filename}: "${section}"`);
		}
	});

	// Check for balanced markers
	const autoStartCount = (content.match(/<!-- AUTO-GENERATED START/g) || [])
		.length;
	const autoEndCount = (content.match(/<!-- AUTO-GENERATED END/g) || []).length;

	if (autoStartCount !== autoEndCount) {
		errors.push(`❌ Unbalanced auto-generated markers in ${filename}`);
	}

	const manualStartCount = (content.match(/<!-- MANUAL START/g) || []).length;
	const manualEndCount = (content.match(/<!-- MANUAL END/g) || []).length;

	if (manualStartCount !== manualEndCount) {
		errors.push(`❌ Unbalanced manual section markers in ${filename}`);
	}

	// Check for broken links
	const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
	for (const match of content.matchAll(linkRegex)) {
		const [, text, href] = match;

		// Skip external links
		if (href.startsWith("http")) continue;

		// Skip anchor links
		if (href.startsWith("#")) continue;

		// Check if file exists
		const linkedPath = path.join(DOCS_DIR, href);
		if (!fs.existsSync(linkedPath)) {
			warnings.push(`⚠️  Broken link in ${filename}: [${text}](${href})`);
		}
	}

	// Check code block syntax (basic check)
	const codeBlockRegex = /```typescript\n([\s\S]*?)\n```/g;
	for (const match of content.matchAll(codeBlockRegex)) {
		const code = match[1];
		// Check for common syntax issues
		if (code.includes("const {") && !code.includes("}")) {
			warnings.push(`⚠️  Incomplete destructuring in ${filename} code block`);
		}
	}
}

function printResults() {
	console.log("\n📋 Documentation Validation Report\n");
	console.log("=".repeat(50));

	if (errors.length === 0 && warnings.length === 0) {
		console.log("✅ All checks passed!\n");
		return 0;
	}

	if (errors.length > 0) {
		console.log("\n❌ ERRORS:\n");
		errors.forEach((err) => {
			console.log(`  ${err}`);
		});
	}

	if (warnings.length > 0) {
		console.log("\n⚠️  WARNINGS:\n");
		warnings.forEach((warn) => {
			console.log(`  ${warn}`);
		});
	}

	console.log(`\n${"=".repeat(50)}\n`);
	console.log(`Total: ${errors.length} errors, ${warnings.length} warnings\n`);

	return errors.length > 0 ? 1 : 0;
}

// Run validation
Object.keys(REQUIRED_SECTIONS).forEach(validateFile);

process.exit(printResults());
