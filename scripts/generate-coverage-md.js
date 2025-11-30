const fs = require('fs');
const path = require('path');

// Read the coverage JSON file
const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-final.json');
const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

// Calculate summary statistics
let totalStatements = 0;
let coveredStatements = 0;
let totalBranches = 0;
let coveredBranches = 0;
let totalFunctions = 0;
let coveredFunctions = 0;
let totalLines = 0;
let coveredLines = 0;

const fileReports = [];

// Process each file in the coverage data
Object.keys(coverageData).forEach(filePath => {
  const file = coverageData[filePath];
  
  // Skip if it's not a source file (skip node_modules, etc.)
  // Handle both Windows and Unix paths
  const normalizedPath = filePath.replace(/\\/g, '/');
  if (!normalizedPath.includes('src/') || normalizedPath.includes('node_modules')) {
    return;
  }
  
  const s = file.s || {};
  const b = file.b || {};
  const f = file.f || {};
  const statementMap = file.statementMap || {};
  const branchMap = file.branchMap || {};
  const fnMap = file.fnMap || {};
  
  // Calculate file-level metrics
  const statements = Object.keys(statementMap);
  const branches = Object.keys(branchMap);
  const functions = Object.keys(fnMap);
  
  const stmtCount = statements.length;
  const stmtCovered = statements.filter(key => s[key] > 0).length;
  
  // For branches, count all locations
  let branchCount = 0;
  let branchCovered = 0;
  branches.forEach(key => {
    const branch = branchMap[key];
    const locations = branch.locations || (branch.loc ? [branch.loc] : []);
    const branchData = b[key] || [];
    
    locations.forEach((loc, idx) => {
      branchCount++;
      if (branchData[idx] > 0) {
        branchCovered++;
      }
    });
  });
  
  const funcCount = functions.length;
  const funcCovered = functions.filter(key => f[key] > 0).length;
  
  // For lines, use statement coverage (simpler approach)
  const lineCount = stmtCount;
  const lineCovered = stmtCovered;
  
  // Update totals
  totalStatements += stmtCount;
  coveredStatements += stmtCovered;
  totalBranches += branchCount;
  coveredBranches += branchCovered;
  totalFunctions += funcCount;
  coveredFunctions += funcCovered;
  totalLines += lineCount;
  coveredLines += lineCovered;
  
  // Calculate percentages
  const stmtPct = stmtCount > 0 ? (stmtCovered / stmtCount * 100).toFixed(2) : '100.00';
  const branchPct = branchCount > 0 ? (branchCovered / branchCount * 100).toFixed(2) : '100.00';
  const funcPct = funcCount > 0 ? (funcCovered / funcCount * 100).toFixed(2) : '100.00';
  const linePct = lineCount > 0 ? (lineCovered / lineCount * 100).toFixed(2) : '100.00';
  
  // Get relative file path (handle both Windows and Unix paths)
  const relativePath = normalizedPath.replace(/^.*\/src\//, 'src/');
  
  fileReports.push({
    path: relativePath,
    statements: { total: stmtCount, covered: stmtCovered, pct: parseFloat(stmtPct) },
    branches: { total: branchCount, covered: branchCovered, pct: parseFloat(branchPct) },
    functions: { total: funcCount, covered: funcCovered, pct: parseFloat(funcPct) },
    lines: { total: lineCount, covered: lineCovered, pct: parseFloat(linePct) }
  });
});

// Sort files by path
fileReports.sort((a, b) => a.path.localeCompare(b.path));

// Calculate overall percentages
const overallStmtPct = totalStatements > 0 ? (coveredStatements / totalStatements * 100).toFixed(2) : '100.00';
const overallBranchPct = totalBranches > 0 ? (coveredBranches / totalBranches * 100).toFixed(2) : '100.00';
const overallFuncPct = totalFunctions > 0 ? (coveredFunctions / totalFunctions * 100).toFixed(2) : '100.00';
const overallLinePct = totalLines > 0 ? (coveredLines / totalLines * 100).toFixed(2) : '100.00';

// Generate markdown report
const md = `# Test Coverage Report

Generated: ${new Date().toISOString()}

## Summary

| Metric | Coverage |
|--------|----------|
| **Statements** | ${overallStmtPct}% (${coveredStatements}/${totalStatements}) |
| **Branches** | ${overallBranchPct}% (${coveredBranches}/${totalBranches}) |
| **Functions** | ${overallFuncPct}% (${coveredFunctions}/${totalFunctions}) |
| **Lines** | ${overallLinePct}% (${coveredLines}/${totalLines}) |

## File Coverage Details

| File | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
${fileReports.map(file => {
  const stmtBar = getBar(file.statements.pct);
  const branchBar = getBar(file.branches.pct);
  const funcBar = getBar(file.functions.pct);
  const lineBar = getBar(file.lines.pct);
  
  return `| \`${file.path}\` | ${file.statements.pct.toFixed(2)}% ${stmtBar} | ${file.branches.pct.toFixed(2)}% ${branchBar} | ${file.functions.pct.toFixed(2)}% ${funcBar} | ${file.lines.pct.toFixed(2)}% ${lineBar} |`;
}).join('\n')}

## Coverage by Directory

${generateDirectoryReport(fileReports)}

---

*This report was generated automatically from test coverage data.*
`;

// Helper function to generate a simple bar
function getBar(percentage) {
  if (percentage >= 90) return '🟢';
  if (percentage >= 70) return '🟡';
  if (percentage >= 50) return '🟠';
  return '🔴';
}

// Group files by directory
function generateDirectoryReport(files) {
  const dirs = {};
  
  files.forEach(file => {
    const dir = file.path.split('/').slice(0, -1).join('/') || 'root';
    if (!dirs[dir]) {
      dirs[dir] = {
        files: [],
        statements: { total: 0, covered: 0 },
        branches: { total: 0, covered: 0 },
        functions: { total: 0, covered: 0 },
        lines: { total: 0, covered: 0 }
      };
    }
    
    dirs[dir].files.push(file);
    dirs[dir].statements.total += file.statements.total;
    dirs[dir].statements.covered += file.statements.covered;
    dirs[dir].branches.total += file.branches.total;
    dirs[dir].branches.covered += file.branches.covered;
    dirs[dir].functions.total += file.functions.total;
    dirs[dir].functions.covered += file.functions.covered;
    dirs[dir].lines.total += file.lines.total;
    dirs[dir].lines.covered += file.lines.covered;
  });
  
  const dirReports = Object.keys(dirs).sort().map(dir => {
    const d = dirs[dir];
    const stmtPct = d.statements.total > 0 ? (d.statements.covered / d.statements.total * 100).toFixed(2) : '100.00';
    const branchPct = d.branches.total > 0 ? (d.branches.covered / d.branches.total * 100).toFixed(2) : '100.00';
    const funcPct = d.functions.total > 0 ? (d.functions.covered / d.functions.total * 100).toFixed(2) : '100.00';
    const linePct = d.lines.total > 0 ? (d.lines.covered / d.lines.total * 100).toFixed(2) : '100.00';
    
    return {
      dir: dir || 'root',
      stmtPct: parseFloat(stmtPct),
      branchPct: parseFloat(branchPct),
      funcPct: parseFloat(funcPct),
      linePct: parseFloat(linePct),
      fileCount: d.files.length
    };
  });
  
  return `| Directory | Files | Statements | Branches | Functions | Lines |
|-----------|-------|-----------|----------|-----------|-------|
${dirReports.map(d => {
  const stmtBar = getBar(d.stmtPct);
  const branchBar = getBar(d.branchPct);
  const funcBar = getBar(d.funcPct);
  const lineBar = getBar(d.linePct);
  
  return `| \`${d.dir}\` | ${d.fileCount} | ${d.stmtPct.toFixed(2)}% ${stmtBar} | ${d.branchPct.toFixed(2)}% ${branchBar} | ${d.funcPct.toFixed(2)}% ${funcBar} | ${d.linePct.toFixed(2)}% ${lineBar} |`;
}).join('\n')}`;
}

// Write markdown file
const outputPath = path.join(__dirname, '..', 'COVERAGE.md');
fs.writeFileSync(outputPath, md, 'utf8');

console.log(`Coverage report generated: ${outputPath}`);
console.log(`Overall coverage: ${overallStmtPct}% statements, ${overallBranchPct}% branches, ${overallFuncPct}% functions, ${overallLinePct}% lines`);

