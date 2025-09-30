# AllIN Platform AI Knowledgebase Index

## Purpose
This knowledgebase serves as the definitive source of truth for AllIN Platform support and technical documentation. It powers our AI support agent with accurate, up-to-date information to help users and provide technical assistance.

## How to Use This Knowledgebase
- **Support Staff**: Use this as reference material for customer inquiries
- **AI Support Agent**: Automatically retrieves relevant sections to answer user questions
- **Developers**: Maintain accuracy by updating relevant sections when features change

## Knowledgebase Structure

### 📋 Documentation Map

| File | Purpose | Use Cases |
|------|---------|-----------|
| `10-architecture.md` | System design and technical overview | Understanding platform structure, debugging |
| `20-domain-glossary.md` | Terms, entities, and constraints | Clarifying terminology, understanding data models |
| `30-user-journeys.md` | Common workflows and edge cases | Troubleshooting user flows, guidance |
| `40-features-and-APIs.md` | Endpoints, authentication, and features | API documentation, integration support |
| `50-config-and-flags.md` | Settings, environment variables, toggles | Configuration issues, feature access |
| `60-troubleshooting.md` | Common errors and solutions | Error resolution, debugging |
| `70-faq.md` | Frequently asked questions | Quick answers, common inquiries |
| `80-security-and-privacy.md` | Data handling, permissions, compliance | Security questions, privacy concerns |
| `90-future-roadmap.md` | Known limitations and planned features | Feature requests, expectation setting |

## Maintenance Guidelines

### For Developers
- **Update immediately** when modifying routes, models, or business logic
- **Cite specific files** using format: `src/routes/auth.routes.ts:45`
- **Test changes** by running ingestion pipeline after updates

### For Support Staff
- **Escalate to engineering** when answers don't match current behavior
- **Report gaps** in documentation through GitHub issues
- **Suggest improvements** based on recurring customer questions

## AI Support Agent Guidelines

### Citation Format
Always cite sources using: `[filename#section]` format
- Example: `[src/routes/auth.routes.ts#login-endpoint]`
- Include line numbers for specific code: `src/services/auth.service.ts:123`

### Confidence Thresholds
- **High (>0.8)**: Provide direct answers with citations
- **Medium (0.6-0.8)**: Answer with caveats and suggest verification
- **Low (<0.6)**: Escalate to human support with context

### Restricted Information
- **Never expose**: Internal file paths beyond citations
- **Always redact**: API keys, passwords, internal URLs
- **Confirm permissions**: Before sharing admin-only features

## Last Updated
This index was last updated: January 2025

## Quick Navigation
- [🏗️ Architecture Overview](./10-architecture.md)
- [📖 Domain Glossary](./20-domain-glossary.md)
- [🛤️ User Journeys](./30-user-journeys.md)
- [🔌 Features & APIs](./40-features-and-APIs.md)
- [⚙️ Configuration](./50-config-and-flags.md)
- [🔧 Troubleshooting](./60-troubleshooting.md)
- [❓ FAQ](./70-faq.md)
- [🔐 Security & Privacy](./80-security-and-privacy.md)
- [🚀 Future Roadmap](./90-future-roadmap.md)