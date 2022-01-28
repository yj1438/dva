import { dva } from '..';

const model1 = {
  namespace: 'model1' as const,
  state: {
    count: 1,
  },
  reducers: {
    update(state, action: { payload: number }) {
    }
  },
  effects: {
    async query(store, action: { payload: number }) {
    }
  }
}

const app = dva({ aaa: model1 }, {});

const _store = app._store;
const _state = _store.getState();

// 这里需要重写 react-redux 模块的相关接口类型
declare module 'react-redux' {
  type State = typeof _state;

  export function useDispatch(): typeof app._store.dispatch;

  export function useSelector<T>(
    selector: (state: typeof _state) => T,
    equalityFn?: (newVal: T, oldVal: T) => boolean,
  ): T;

  export function useStore(): typeof app._store;
}

export default app;

// Use example:
// 
// state.model1.count
// 
// app._store.dispatch({ type: 'model1/query', payload: 1 })
// 
// _store.watch(
//   state => state.model1.count,
//   (newVal, oldVal, diffCont) => {
//     console.log(newVal, oldVal, diffCont);
//   },
//   {
//     compare: 'default',
//     immediate: true,
//   }
// )
