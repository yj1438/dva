export default {
  namespace: 'data',

  state: {
    count: 0,
  },

  subscriptions: {
    setup({ dispatch, history }) {
      console.log(history.location);
      dispatch({ type: 'fetch' });
    },
  },

  reducers: {
    add(state, { payload }) {
      return {
        ...state,
        count: state.count + payload,
      };
    },
  },

  effects: {
    async fetch({ put }) {
      put({ type: 'add', payload: 1 });
    },
  },
};
