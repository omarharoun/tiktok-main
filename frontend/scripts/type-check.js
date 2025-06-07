const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔍 Starting comprehensive TypeScript compilation check...\n");

// Check if tsconfig.json exists
const tsconfigPath = path.join(__dirname, "..", "tsconfig.json");
if (!fs.existsSync(tsconfigPath)) {
  console.log("❌ tsconfig.json not found. Creating one...");
  // Create basic tsconfig.json
  const basicTsConfig = {
    extends: "expo/tsconfig.base",
    compilerOptions: {
      strict: true,
      noEmit: true,
      skipLibCheck: true,
    },
  };
  fs.writeFileSync(tsconfigPath, JSON.stringify(basicTsConfig, null, 2));
  console.log("✅ Created basic tsconfig.json\n");
}

try {
  console.log("📝 Running TypeScript compilation...");

  // Run TypeScript compiler
  const result = execSync("npx tsc --noEmit --pretty", {
    encoding: "utf8",
    cwd: path.join(__dirname, ".."),
    timeout: 60000, // 60 seconds timeout
  });

  console.log("✅ TypeScript compilation successful!");
  console.log("No type errors found.\n");
} catch (error) {
  console.log("❌ TypeScript compilation found issues:\n");
  console.log(error.stdout || error.message);

  // Save errors to file
  const errorLog = `TypeScript Compilation Errors - ${new Date().toISOString()}\n\n${error.stdout || error.message}`;
  fs.writeFileSync(
    path.join(__dirname, "..", "typescript-errors.log"),
    errorLog
  );

  console.log("\n📄 Error details saved to: typescript-errors.log");

  // Count different types of errors
  const output = error.stdout || error.message;
  const errorCount = (output.match(/error TS/g) || []).length;
  const warningCount = (output.match(/warning TS/g) || []).length;

  console.log(`\n📊 Summary:`);
  console.log(`   • Errors: ${errorCount}`);
  console.log(`   • Warnings: ${warningCount}`);
}

console.log("\n🏁 Compilation check complete.");
