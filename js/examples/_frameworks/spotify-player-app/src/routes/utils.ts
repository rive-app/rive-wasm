export function throttle(f: Function, delay: number) {
  let timer = 0;
  return function (this: Function, ...args: any) {
    clearTimeout(timer);
    timer = window.setTimeout(() => f.apply(this, args), delay);
  };
}
