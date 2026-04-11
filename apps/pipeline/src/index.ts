import { getShowdownAdapterSummary } from "@vgc/showdown-adapter";

const showdownSummary = getShowdownAdapterSummary();

console.log("Pipeline scaffold ready. Implement replay parser and simulation jobs in Phase 0.");
console.log(`Showdown adapter loaded from ${showdownSummary.source}`);
