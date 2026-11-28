### What this proposes

A prepared device lets a learner review words and edit their word bank offline. It saves each change locally, then exchanges changes with Supabase when it can. Separate reviews on two devices both count, while retrying an upload preserves the original visit count and study date.

### How the existing system works, per this document

Each browser currently keeps its own word bank and review history. The existing save records totals per word and one day’s credits, so two browsers’ saves can contain overlapping reviews that the app cannot identify individually.

### Findings

- **Major — Goals and first connection, lines 19, 27 and 61.** “Show the overlap” leaves the learner-facing promise unclear. The app can identify that both saves contain 地图, but it cannot identify which visits they share. Say what the learner can compare, such as each copy’s visit total for that word, and list the first-connection merge policy among the open decisions. The edit-versus-removal example concerns a different conflict after connection.
- **Major — Connected learners, lines 7, 16, 23, 45 and 63.** “Connected” sometimes describes having network access and sometimes appears to mean that the browser is associated with a learner’s account. The distinction affects what happens when someone launches the app online with an expired session. Use separate terms for network access and account connection, and say what the learner can still do while sign-in is required.
- **Nit — Study levels, lines 23 and 57.** The draft says that selected review levels sync while “continuing into HSK” stays local. A new reader cannot tell which learner action changes a saved level and which applies only to the current session. Expand HSK on first use and give one example of each action.
