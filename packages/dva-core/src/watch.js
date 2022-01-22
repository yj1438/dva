// https://github.com/ExodusMovement/redux-watch
import deepDiff from './deepDiff';

function defaultCompare(a, b) {
  return a === b ? null : b;
}

function deepDiffCompare(a, b) {
  return deepDiff(a, b, { N: true, D: true });
}

const CompareFnMap = {
  default: defaultCompare,
  deepdiff: deepDiffCompare,
};

/**
 *
 * @param {function} getState
 * @param {function} selectFn
 * @param {"default" | "deepdiff"} compare 选用的 diff 方案
 * @param {any} initValue
 * @returns
 */
function watch(getState, selectFn, compare = 'default', initValue) {
  const compareFn = CompareFnMap[compare] || defaultCompare;
  let currentValue = initValue || selectFn(getState());
  return function w(fn) {
    return function() {
      const newValue = selectFn(getState());
      const diffCont = compareFn(currentValue, newValue);
      if (diffCont) {
        const oldValue = currentValue;
        currentValue = newValue;
        fn(newValue, oldValue, diffCont);
      }
    };
  };
}

export default watch;
