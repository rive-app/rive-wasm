// Slowly moving functionality over to Typescript

// Loop types. The index of the type is the value that comes from Wasm
export const loopTypes: Array<string> = ['oneShot', 'loop', 'pingPong'];


interface LoopEvent {
  animation: string;
  loopType: number;
  loopName: string;
}

// Creates a new LoopEvent
export let createLoopEvent = function (animation: string, loopValue: number) : LoopEvent {
  if (loopValue < 0 || loopValue >= loopTypes.length) {
    throw 'Invalid loop value';
  }
  return {
    animation: animation,
    loopType: loopValue,
    loopName: loopTypes[loopValue],
  }
}
