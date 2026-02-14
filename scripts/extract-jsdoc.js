#!/usr/bin/env node
/**
 * Extracts JSDoc comments from store slices
 * Generates API documentation from source code
 */

const fs = require("node:fs");
const path = require("node:path");

const STORE_SLICES_DIR = path.join(__dirname, "../src/store/slices");

/**
 * @typedef {Object} JsDocInfo
 * @property {string} name
 * @property {string} description
 * @property {Array} params
 * @property {string} returns
 * @property {string[]} examples
 * @property {string[]} see
 */

/**
 * Parse JSDoc comment block
 */
function parseJsDoc(comment) {
	const lines = comment
		.split("\n")
		.map((line) => line.replace(/^\s*\*\s?/, ""));

	const result = {
		description: "",
		params: [],
		returns: "",
		examples: [],
		see: [],
	};

	let currentSection = "description";
	let currentExample = "";

	lines.forEach((line) => {
		if (line.startsWith("@param")) {
			const match = line.match(/@param\s+{?(\w+)}?\s+(\w+)\s+-\s+(.*)/);
			if (match) {
				result.params.push({
					name: match[2],
					type: match[1] || "any",
					description: match[3],
				});
			}
			currentSection = "param";
		} else if (line.startsWith("@returns")) {
			result.returns = line.replace(/@returns\s+/, "");
			currentSection = "returns";
		} else if (line.startsWith("@example")) {
			currentExample = "";
			currentSection = "example";
		} else if (line.startsWith("@see")) {
			result.see.push(line.replace(/@see\s+/, ""));
			currentSection = "see";
		} else if (line && currentSection === "description") {
			result.description += (result.description ? " " : "") + line;
		} else if (line && currentSection === "example") {
			currentExample += `${line}\n`;
			if (
				currentExample.endsWith("\n") &&
				result.examples[result.examples.length - 1] !== currentExample
			) {
				result.examples.push(currentExample.trim());
			}
		}
	});

	return result;
}

/**
 * Extract function signature from code
 */
function _extractSignature(code, functionName) {
	const regex = new RegExp(String.raw`${functionName}\s*:\s*\((.*?)\)\s*=>`, "s");
	const match = code.match(regex);
	return match ? match[1] : "";
}

/**
 * Scan slice file for exported functions
 */
function scanSliceFile(filePath) {
	const _content = fs.readFileSync(filePath, "utf-8");
	const fileName = path.basename(filePath, ".ts");

	const functions = [];

	// Find all JSDoc comments
	const jsDocRegex = /\/\*\*([\s\S]*?)\*\/\s+(\w+):/g;

	for (const match of _content.matchAll(jsDocRegex)) {
		const [, jsDocBody, functionName] = match;
		const jsDocInfo = parseJsDoc(jsDocBody);

		functions.push({
			name: functionName,
			...jsDocInfo,
		});
	}

	return {
		fileName,
		functions,
	};
}

/**
 * Generate markdown from extracted JSDoc
 */
function generateMarkdown(sliceData) {
	let markdown = `\n### ${sliceData.fileName.charAt(0).toUpperCase() + sliceData.fileName.slice(1)} Slice\n\n`;

	sliceData.functions.forEach((fn) => {
		markdown += `#### \`${fn.name}()\`\n\n`;

		if (fn.description) {
			markdown += `${fn.description}\n\n`;
		}

		if (fn.params.length > 0) {
			markdown += `**Parameters:**\n`;
			fn.params.forEach((param) => {
				markdown += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
			});
			markdown += "\n";
		}

		if (fn.returns) {
			markdown += `**Returns:** ${fn.returns}\n\n`;
		}

		if (fn.examples.length > 0) {
			markdown += `**Example:**\n\`\`\`typescript\n${fn.examples[0]}\n\`\`\`\n\n`;
		}

		if (fn.see.length > 0) {
			markdown += `**See also:** ${fn.see.join(", ")}\n\n`;
		}

		markdown += "---\n\n";
	});

	return markdown;
}

/**
 * Main execution
 */
function main() {
	console.log("🔍 Scanning store slices for JSDoc...\n");

	const files = fs
		.readdirSync(STORE_SLICES_DIR)
		.filter((f) => f.endsWith(".ts"));

	let totalFunctions = 0;

	files.forEach((file) => {
		const filePath = path.join(STORE_SLICES_DIR, file);
		const sliceData = scanSliceFile(filePath);

		console.log(
			`✅ ${file}: Found ${sliceData.functions.length} documented functions`,
		);
		totalFunctions += sliceData.functions.length;

		// Generate markdown
		const markdown = generateMarkdown(sliceData);

		// Output for reference (can be piped to STORE_API.md)
		if (process.argv.includes("--output")) {
			console.log(markdown);
		}
	});

	console.log(`\n📊 Total documented functions: ${totalFunctions}\n`);
	console.log(
		"Tip: Run with --output flag and paste into ENGINEERING.md (Store API section).\n",
	);
}

main();
