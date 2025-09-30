#!/usr/bin/env ts-node

/**
 * AllIN Platform Documentation Link Checker
 *
 * Validates all internal links in the AI knowledgebase documentation
 * to ensure referential integrity across all markdown files.
 *
 * Features:
 * - Checks internal markdown links
 * - Validates file path references
 * - Reports broken links with suggestions
 * - CI-friendly exit codes
 *
 * Usage:
 *   npm run check:links
 */

import fs from 'fs/promises'
import path from 'path'
import fastGlob from 'fast-glob'

interface LinkIssue {
  file: string
  line: number
  link: string
  issue: string
  suggestion?: string
}

class LinkChecker {
  private readonly docsPath: string
  private readonly issues: LinkIssue[] = []
  private readonly validFiles: Set<string> = new Set()

  constructor(docsPath: string) {
    this.docsPath = docsPath
  }

  async run(): Promise<boolean> {
    console.log('🔍 Checking documentation links...')
    console.log(`📁 Source path: ${this.docsPath}`)

    try {
      // Build index of valid files
      await this.buildFileIndex()

      // Find and check all markdown files
      const markdownFiles = await this.findMarkdownFiles()
      console.log(`📄 Found ${markdownFiles.length} markdown files`)

      // Check each file
      for (const filePath of markdownFiles) {
        await this.checkFile(filePath)
      }

      // Report results
      this.reportResults()

      return this.issues.length === 0
    } catch (error) {
      console.error('💥 Link checking failed:', error)
      return false
    }
  }

  private async buildFileIndex(): Promise<void> {
    const pattern = path.join(this.docsPath, '**/*.md').replace(/\\/g, '/')
    const files = await fastGlob(pattern, {
      ignore: ['**/node_modules/**', '**/.*/**'],
      absolute: false,
      cwd: this.docsPath
    })

    for (const file of files) {
      this.validFiles.add(file)
      this.validFiles.add(path.basename(file))
      this.validFiles.add(path.basename(file, '.md'))
    }

    console.log(`📚 Built index of ${this.validFiles.size} valid files`)
  }

  private async findMarkdownFiles(): Promise<string[]> {
    const pattern = path.join(this.docsPath, '**/*.md').replace(/\\/g, '/')
    return await fastGlob(pattern, {
      ignore: ['**/node_modules/**', '**/.*/**'],
      absolute: true
    })
  }

  private async checkFile(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8')
    const lines = content.split('\\n')
    const relativePath = path.relative(this.docsPath, filePath)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNumber = i + 1

      // Check markdown links [text](./file.md) or [text](./file.md#section)
      const markdownLinkRegex = /\\[([^\\]]+)\\]\\(\\.\\/([^)#]+(?:\\.md)?)(?:#([^)]+))?\\)/g
      let match

      while ((match = markdownLinkRegex.exec(line)) !== null) {
        const [fullMatch, linkText, linkPath, anchor] = match
        await this.validateMarkdownLink(relativePath, lineNumber, linkPath, anchor, fullMatch)
      }

      // Check file references like src/services/auth.service.ts:123
      const fileRefRegex = /\\b([a-zA-Z0-9._/-]+\\.(ts|js|tsx|jsx|md))(?::(\\d+))?\\b/g

      while ((match = fileRefRegex.exec(line)) !== null) {
        const [fullMatch, filePath] = match
        // For now, we only validate references to markdown files
        if (filePath.endsWith('.md')) {
          await this.validateFileReference(relativePath, lineNumber, filePath, fullMatch)
        }
      }
    }
  }

  private async validateMarkdownLink(
    currentFile: string,
    lineNumber: number,
    linkPath: string,
    anchor: string | undefined,
    fullLink: string
  ): Promise<void> {
    // Resolve relative path
    const targetPath = path.resolve(path.dirname(path.join(this.docsPath, currentFile)), linkPath)
    const relativeLinkPath = path.relative(this.docsPath, targetPath)

    // Check if target file exists
    try {
      await fs.access(targetPath)
    } catch (error) {
      this.issues.push({
        file: currentFile,
        line: lineNumber,
        link: fullLink,
        issue: `Target file does not exist: ${linkPath}`,
        suggestion: this.findSimilarFile(linkPath)
      })
      return
    }

    // If there's an anchor, validate it exists in the target file
    if (anchor) {
      await this.validateAnchor(currentFile, lineNumber, targetPath, anchor, fullLink)
    }
  }

  private async validateFileReference(
    currentFile: string,
    lineNumber: number,
    filePath: string,
    fullReference: string
  ): Promise<void> {
    // For markdown references, check if file exists in docs
    if (filePath.endsWith('.md')) {
      const targetPath = path.join(this.docsPath, filePath)

      try {
        await fs.access(targetPath)
      } catch (error) {
        this.issues.push({
          file: currentFile,
          line: lineNumber,
          link: fullReference,
          issue: `Referenced markdown file does not exist: ${filePath}`,
          suggestion: this.findSimilarFile(filePath)
        })
      }
    }
  }

  private async validateAnchor(
    currentFile: string,
    lineNumber: number,
    targetPath: string,
    anchor: string,
    fullLink: string
  ): Promise<void> {
    try {
      const content = await fs.readFile(targetPath, 'utf-8')
      const anchors = this.extractAnchors(content)

      // Normalize anchor (convert to lowercase, replace spaces with hyphens)
      const normalizedAnchor = anchor.toLowerCase().replace(/\\s+/g, '-').replace(/[^\\w-]/g, '')

      if (!anchors.has(normalizedAnchor)) {
        this.issues.push({
          file: currentFile,
          line: lineNumber,
          link: fullLink,
          issue: `Anchor '#${anchor}' not found in target file`,
          suggestion: this.findSimilarAnchor(normalizedAnchor, anchors)
        })
      }
    } catch (error) {
      this.issues.push({
        file: currentFile,
        line: lineNumber,
        link: fullLink,
        issue: `Could not read target file to validate anchor: ${error}`
      })
    }
  }

  private extractAnchors(content: string): Set<string> {
    const anchors = new Set<string>()

    // Extract headings (# ## ### etc.)
    const headingRegex = /^#{1,6}\\s+(.+)$/gm
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const heading = match[1].trim()
      // Convert to anchor format (lowercase, spaces to hyphens, remove special chars)
      const anchor = heading.toLowerCase().replace(/\\s+/g, '-').replace(/[^\\w-]/g, '')
      anchors.add(anchor)
    }

    return anchors
  }

  private findSimilarFile(targetFile: string): string | undefined {
    const basename = path.basename(targetFile, path.extname(targetFile))
    const candidates: string[] = []

    for (const validFile of this.validFiles) {
      const validBasename = path.basename(validFile, path.extname(validFile))

      // Exact basename match
      if (validBasename === basename) {
        candidates.push(validFile)
      }
      // Partial match
      else if (validBasename.includes(basename) || basename.includes(validBasename)) {
        candidates.push(validFile)
      }
    }

    if (candidates.length > 0) {
      return `Did you mean: ${candidates[0]}?`
    }

    return undefined
  }

  private findSimilarAnchor(targetAnchor: string, validAnchors: Set<string>): string | undefined {
    const candidates: string[] = []

    for (const anchor of validAnchors) {
      // Partial match
      if (anchor.includes(targetAnchor) || targetAnchor.includes(anchor)) {
        candidates.push(anchor)
      }
    }

    if (candidates.length > 0) {
      return `Did you mean: #${candidates[0]}?`
    }

    return undefined
  }

  private reportResults(): void {
    console.log('\\n📊 Link Check Results:')

    if (this.issues.length === 0) {
      console.log('✅ All links are valid!')
      return
    }

    console.log(`❌ Found ${this.issues.length} link issues:\\n`)

    // Group issues by file
    const issuesByFile = new Map<string, LinkIssue[]>()
    for (const issue of this.issues) {
      if (!issuesByFile.has(issue.file)) {
        issuesByFile.set(issue.file, [])
      }
      issuesByFile.get(issue.file)!.push(issue)
    }

    // Report issues
    for (const [file, issues] of issuesByFile) {
      console.log(`📄 ${file}:`)
      for (const issue of issues) {
        console.log(`  Line ${issue.line}: ${issue.issue}`)
        console.log(`    Link: ${issue.link}`)
        if (issue.suggestion) {
          console.log(`    💡 ${issue.suggestion}`)
        }
        console.log('')
      }
    }

    console.log(`\\n⚠️  Total issues: ${this.issues.length}`)
    console.log('Please fix these issues before deploying the documentation.')
  }
}

// CLI Interface
async function main() {
  const docsPath = path.resolve(__dirname, '../../docs/ai-knowledgebase')

  try {
    // Check if docs directory exists
    await fs.access(docsPath)
  } catch (error) {
    console.error(`❌ Documentation directory not found: ${docsPath}`)
    console.error('Please ensure the ai-knowledgebase directory exists')
    process.exit(1)
  }

  const checker = new LinkChecker(docsPath)

  try {
    const success = await checker.run()

    if (success) {
      console.log('✅ All links are valid')
      process.exit(0)
    } else {
      console.log('❌ Link validation failed')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Link checking failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { LinkChecker }