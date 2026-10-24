// Only @rive-app/webgl2-threads bundles a threaded build; every other package
// bundles an empty module here.
import type Rive from "./rive_advanced.mjs";

declare const RiveThreads: typeof Rive | undefined;
export default RiveThreads;
