# UI Kit for the Jira issue panel

The panel needs two number inputs, a decision result, and a short history list. UI Kit (`@forge/react`) covers every component and needs no bundler or build step: the manifest resource points at the source file. Custom UI would need a Vite build to a `build/` folder and buys nothing for this panel, so we use UI Kit and accept its limits (no direct DOM access).
