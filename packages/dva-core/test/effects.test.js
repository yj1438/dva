import expect from 'expect';
import mm from 'mm';
import { create } from '../src/index';

const delay = timeout => new Promise(resolve => setTimeout(resolve, timeout));

describe('effects', () => {
  it('put action', done => {
    const app = create();
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add(state, { payload }) {
          return state + payload || 1;
        },
      },
      effects: {
        async addDelay({ put, call }, { payload }) {
          await call(delay, 100);
          await put({ type: 'add', payload });
        },
      },
    });
    app.start();
    app._store.dispatch({ type: 'count/addDelay', payload: 2 });
    expect(app._store.getState().count).toEqual(0);
    setTimeout(() => {
      expect(app._store.getState().count).toEqual(2);
      done();
    }, 200);
  });

  function testAppCreator(opts) {
    const app = create(opts);
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add(state, { payload }) {
          return state + payload || 1;
        },
      },
      effects: {
        putWithNamespace({ put }, { payload }) {
          put({ type: 'count/add', payload });
        },
        putWithoutNamespace({ put }, { payload }) {
          put({ type: 'add', payload });
        },
      },
    });
    return app;
  }

  it('put action with namespace will get a warning', async () => {
    const app = testAppCreator();
    const logs = [];
    mm(console, 'error', log => {
      logs.push(log);
    });
    app.start();
    expect(app._store.getState().count).toEqual(0);
    expect(logs.length).toEqual(0);
    await app._store.dispatch({ type: 'count/putWithNamespace', payload: 2 });
    expect(logs.length).toEqual(1);
    expect(logs[0]).toEqual('Warning: [put] count/add should not be prefixed with namespace count');
    await app._store.dispatch({ type: 'count/putWithoutNamespace', payload: 2 });
    expect(logs.length).toEqual(1);
    expect(app._store.getState().count).toEqual(4);
    mm.restore();
  });

  it('test disable namespacePrefixWarning', async () => {
    const app = testAppCreator({ namespacePrefixWarning: false });
    const logs = [];
    mm(console, 'error', log => {
      logs.push(log);
    });
    app.start();
    expect(app._store.getState().count).toEqual(0);
    expect(logs.length).toEqual(0);
    await app._store.dispatch({ type: 'count/putWithNamespace', payload: 2 });
    expect(logs.length).toEqual(1);
    await app._store.dispatch({ type: 'count/putWithoutNamespace', payload: 2 });
    expect(logs.length).toEqual(1);
    expect(app._store.getState().count).toEqual(4);
    mm.restore();
  });

  it('put multi effects in order', done => {
    const app = create();
    app.model({
      namespace: 'counter',
      state: {
        count: 0,
        resolveCount: 0,
      },
      reducers: {
        dump(state, { payload }) {
          return {
            ...state,
            ...payload,
          };
        },
      },
      effects: {
        async changeCountDelay({ put, call }, { payload }) {
          await call(delay, 200);
          await put({ type: 'dump', payload: { count: payload } });
        },
        async process({ put, select }, { payload }) {
          await put({ type: 'changeCountDelay', payload });
          const count = await select(state => state.counter.count);
          await put({ type: 'dump', payload: { resolveCount: count } });
        },
      },
    });
    app.start();
    app._store.dispatch({ type: 'counter/process', payload: 1 }).then(() => {
      expect(app._store.getState().counter.resolveCount).toEqual(1);
      done();
    });
    expect(app._store.getState().counter.resolveCount).toEqual(0);
  });

  it('dispatch action for other models', () => {
    const app = create();
    app.model({
      namespace: 'loading',
      state: false,
      reducers: {
        show() {
          return true;
        },
      },
    });
    app.model({
      namespace: 'count',
      state: 0,
      effects: {
        addDelay({ dispatch }) {
          dispatch({ type: 'loading/show' });
        },
      },
    });
    app.start();
    app._store.dispatch({ type: 'count/addDelay' });
    expect(app._store.getState().loading).toEqual(true);
  });

  it('onError', async () => {
    const errors = [];
    const app = create({
      onError: (error, dispatch) => {
        error.preventDefault();
        errors.push(error.message);
        dispatch({ type: 'count/add' });
      },
    });
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add(state, { payload }) {
          return state + payload || 1;
        },
      },
      effects: {
        async addDelay({ put }, { payload }) {
          if (!payload) {
            throw new Error('effect error');
          } else {
            await put({ type: 'add', payload });
          }
        },
      },
    });
    app.start();
    await app._store.dispatch({ type: 'count/addDelay' });
    expect(errors).toEqual(['effect error']);
    expect(app._store.getState().count).toEqual(1);
    await app._store.dispatch({ type: 'count/addDelay', payload: 2 });
    expect(app._store.getState().count).toEqual(3);
  });

  it('onError: extension', async () => {
    const app = create({
      onError(err, dispatch, extension) {
        err.preventDefault();
        dispatch({
          type: 'err/append',
          payload: extension,
        });
      },
    });
    app.model({
      namespace: 'err',
      state: [],
      reducers: {
        append(state, action) {
          return [...state, action.payload];
        },
      },
      effects: {
        // eslint-disable-next-line
        generate() {
          throw new Error('Effect error');
        },
      },
    });
    app.start();
    await app._store.dispatch({
      type: 'err/generate',
      payload: 'err.payload',
    });
    expect(app._store.getState().err.length).toEqual(1);
    expect(app._store.getState().err[0].payload).toEqual('err.payload');
    expect(app._store.getState().err[0].type).toEqual('err/generate');
  });

  it('onEffect', done => {
    const SHOW = '@@LOADING/SHOW';
    const HIDE = '@@LOADING/HIDE';

    const app = create();

    // Test model should be accessible
    let modelNamespace = null;
    // Test onEffect should be run orderly
    let count = 0;
    let expectedKey = null;

    app.use({
      extraReducers: {
        loading(state = false, action) {
          switch (action.type) {
            case SHOW:
              return true;
            case HIDE:
              return false;
            default:
              return state;
          }
        },
      },
      onEffect(effect, { put }, model, key) {
        expectedKey = key;
        modelNamespace = model.namespace;
        return async function(...args) {
          count *= 2;
          await put({ type: SHOW });
          await effect(...args);
          await put({ type: HIDE });
        };
      },
    });

    app.use({
      onEffect(effect) {
        return async function(...args) {
          count += 2;
          await effect(...args);
          count += 1;
        };
      },
    });

    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add(state) {
          return state + 1;
        },
      },
      effects: {
        async addRemote({ put }, action) {
          await delay(100);
          await put({ type: 'add' });
        },
      },
    });

    app.start();

    expect(app._store.getState().loading).toEqual(false);

    app._store.dispatch({ type: 'count/addRemote' });
    expect(app._store.getState().loading).toEqual(true);
    expect(modelNamespace).toEqual('count');
    expect(expectedKey).toEqual('count/addRemote');

    setTimeout(() => {
      expect(app._store.getState().loading).toEqual(false);
      expect(app._store.getState().count).toEqual(1);
      expect(count).toEqual(5);
      done();
    }, 200);
  });

  it('return Promise', done => {
    const app = create();
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add(state, { payload }) {
          return state + payload || 1;
        },
      },
      effects: {
        async addDelay({ put, call, select }, { payload }) {
          await call(delay, payload.delay || 100);
          await put({ type: 'add', payload: payload.amount });
          return select(state => state.count);
        },
      },
    });
    app.start();
    const p1 = app._store.dispatch({
      type: 'count/addDelay',
      payload: { amount: 2 },
    });
    const p2 = app._store.dispatch({
      type: 'count/add',
      payload: 2,
    });
    expect(p1 instanceof Promise).toEqual(true);
    expect(p2).toEqual({ type: 'count/add', payload: 2 });
    expect(app._store.getState().count).toEqual(2);
    p1.then(count => {
      expect(count).toEqual(4);
      expect(app._store.getState().count).toEqual(4);
      done();
    });
  });

  it('return Promises when trigger the same effect multiple times', done => {
    const app = create();
    app.model({
      namespace: 'count',
      state: 0,
      reducers: {
        add(state, { payload }) {
          return state + payload || 1;
        },
      },
      effects: {
        async addDelay({ put, call, select }, { payload }) {
          await call(delay, payload.delay || 100);
          put({ type: 'add', payload: payload.amount });
          return select(state => state.count);
        },
      },
    });
    app.start();

    const p1 = app._store.dispatch({
      type: 'count/addDelay',
      payload: { delay: 100, amount: 1 },
    });
    const p2 = app._store.dispatch({
      type: 'count/add',
      payload: 2,
    });
    const p3 = app._store.dispatch({
      type: 'count/addDelay',
      payload: { delay: 200, amount: 3 },
    });
    expect(p1 instanceof Promise).toEqual(true);
    expect(p2).toEqual({ type: 'count/add', payload: 2 });
    expect(app._store.getState().count).toEqual(2);
    p1.then(count => {
      expect(count).toEqual(3);
      expect(app._store.getState().count).toEqual(3);
      p3.then(count => {
        expect(count).toEqual(6);
        expect(app._store.getState().count).toEqual(6);
        done();
      });
    });
  });
});
