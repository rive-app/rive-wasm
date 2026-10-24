// emcc's abort leaves the pool's workers running, so a threaded build that
// fails to start, and gives way to the build without threads, ends them here.
const threadsOnAbort = Module["onAbort"];
Module["onAbort"] = function (what) {
  if (!ENVIRONMENT_IS_PTHREAD) {
    PThread.terminateAllThreads();
  }
  threadsOnAbort && threadsOnAbort(what);
};
