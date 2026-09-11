# Security and data handling

The application has no backend and sends no project data to an application server. Local storage and exported JSON may contain sensitive facility information; manage backups and repository contents accordingly.

Imports are bounded and schema-validated. User-entered text is rendered through React's escaped text handling, including printed reports. The app does not accept HTML as project content or execute formulas from files.

For a security issue, use GitHub's private vulnerability reporting if enabled by the repository owner. Avoid publishing private project files or confidential assessments in public issues. Calculation correctness issues should include minimal fictional reproduction data.

Source references and input snapshots are user-supplied records, not authenticated engineering approvals. The optional browser assessment tool is read-only and exposes only the current summary, not private evidence documents.
