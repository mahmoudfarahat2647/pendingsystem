const { execSync } = require("child_process");
try {
	const output = execSync("npx @biomejs/biome check src/ --reporter=json", {
		encoding: "utf8",
		maxBuffer: 10 * 1024 * 1024,
	});
} catch (e) {
	const data = JSON.parse(e.stdout || "{}");
	const btnErrs = (data.diagnostics || []).filter(
		(d) => d.category === "lint/a11y/useButtonType",
	);
	const anyErrs = (data.diagnostics || []).filter(
		(d) => d.category === "lint/suspicious/noExplicitAny",
	);
	console.log("ANY:", anyErrs.length, "BTN:", btnErrs.length);
	btnErrs.forEach((b) => {
		console.log(b.location.path.file, JSON.stringify(b.location.span));
	});
}
