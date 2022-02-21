import expect from 'expect';
import { create } from '../src/index';

describe('core.watch', () => {
  it('default watch', async () => {
    const initValue = 'zhangsan';
    const newValue = 'lisi';

    const app = create();

    app.model({
      namespace: 'users',
      state: {
        name: initValue,
      },
      reducers: {
        updateName(state, { payload }) {
          return { ...state, name: payload };
        },
      },
    });
    app.start();

    let { name } = app._store.getState().users;

    app._store.watch(
      s => s.users.name,
      newValue => {
        name = newValue;
      },
      { compare: 'default' },
    );

    expect(name).toEqual(initValue);
    await app._store.dispatch({ type: 'users/updateName', payload: newValue });
    expect(name).toEqual(newValue);
  });

  it('deepdiff watch', async () => {
    const initValue = { aaa: 111, bbb: 222 };
    const newValue = { bbb: 222, ccc: 333 };

    const app = create();

    app.model({
      namespace: 'data',
      state: {
        obj: initValue,
      },
      reducers: {
        updateObj(state, { payload }) {
          return { ...state, obj: payload };
        },
      },
    });
    app.start();

    let { obj } = app._store.getState().data;
    let diff = null;

    app._store.watch(
      s => s.data.obj,
      (newValue, oldValue, diffCont) => {
        obj = newValue;
        diff = diffCont;
      },
      { compare: 'deepdiff' },
    );

    expect(obj).toEqual(initValue);
    await app._store.dispatch({ type: 'data/updateObj', payload: newValue });
    expect(obj).toEqual(newValue);
    expect(diff).toEqual({ aaa: undefined, ccc: 333 });
  });
});
