#!/usr/bin/env node

/**
 * Fix response variable naming issues in test files
 * Changes _response back to response where it's actually used
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all test files
const testFiles = [
  ...glob.sync('src/**/*.test.ts'),
  ...glob.sync('tests/**/*.test.ts'),
  ...glob.sync('src/**/*.spec.ts'),
  ...glob.sync('tests/**/*.spec.ts')
];

console.log(`Found ${testFiles.length} test files to fix`);

let filesFixed = 0;

testFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix response variable references
    // If we have _response but we're using response, keep it as response
    const lines = content.split('\n');
    const fixedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Check if this line declares _response
      if (line.includes('const _response = await request')) {
        // Look ahead to see if response is used (not _response)
        let responseUsed = false;
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          if (lines[j].includes('expect(response.') && !lines[j].includes('expect(_response.')) {
            responseUsed = true;
            break;
          }
        }
        
        // If response is used, change _response to response
        if (responseUsed) {
          line = line.replace('const _response =', 'const response =');
        }
      }
      
      fixedLines.push(line);
    }
    
    content = fixedLines.join('\n');

    // Only write if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      filesFixed++;
      console.log(`✅ Fixed: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n📊 Summary:`);
console.log(`Files fixed: ${filesFixed}/${testFiles.length}`);
console.log(`\n✨ Response variables should now be correct!`);