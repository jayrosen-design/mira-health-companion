# Project rules
- Share the assistant avatar, site logo, and site footer through BrandIdentity so identity stays consistent across existing screens without changing behavior.
- Express surface, status-pill and shadow styling through global semantic tokens and shared UI variants so all screens remain consistently themed.
- Keep color scheme state in the root ThemeProvider and URL search, retain the theme parameter with root search middleware, and never persist it in browser storage; this supports independent comparison iframes and shareable scheme links.