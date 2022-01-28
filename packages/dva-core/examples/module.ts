import app from './index';

// Use example:

const state = app._store.getState();

console.log(state.model1.count);

app._store.dispatch({ type: 'model1/query', payload: 1 });

app._store.watch(
  state => state.model1.count,
  (newVal, oldVal, diffCont) => {
    console.log(newVal, oldVal, diffCont);
  },
  {
    compare: 'default',
    immediate: true,
  },
);
