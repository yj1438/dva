import {
  Reducer,
  ReducersMapObject,
  MiddlewareAPI,
  StoreEnhancer,
  Unsubscribe,
  Observable,
  AnyAction,
} from 'redux';
import { Connect, Provider } from 'react-redux';

type Dispatch = (action: Action<any, any>) => Promise<any> | any;

interface onActionFunc {
  (api: MiddlewareAPI<any>): void,
}

interface EffectsCommandMap {
  put: <A extends Action<any, any>>(action: A) => any,
  dispatch: <A extends Action<any, any>>(action: A) => any,
  call: Function,
  select: Function,
  getState: () => any,
  [key: string]: any,
}

type Effect = (effects: EffectsCommandMap, action: Action<any, any, any>) => void;

type EffectsMapObject = {
  [key: string]: Effect,
}

type ReducerEnhancer = {
  (reducer: Reducer<any>): void,
}

interface Hooks {
  onError?: (e: Error, dispatch: Function, info: any) => void,
  onAction?: onActionFunc | onActionFunc[],
  onStateChange?: () => void,
  onReducer?: ReducerEnhancer,
  onEffect?: () => void,
  onHmr?: () => void,
  extraReducers?: ReducersMapObject,
  extraEnhancers?: StoreEnhancer<any>[],
}

interface SubscriptionAPI {
  // history: History,
  dispatch: Dispatch,
}

type Subscription = (api: SubscriptionAPI, done: Function) => void;

interface SubscriptionsMapObject {
  [key: string]: Subscription,
}

interface RouterAPI {
  // history: History,
  app: DvaInstance<any>,
}

interface Router {
  (api?: RouterAPI): JSX.Element | Object,
}

type PluginFn = (...args: any[]) => void;

type PluginEmit = (r: Reducer) => Reducer;

interface PluginHooks {
  [key: string]: Array<PluginFn>
}

export interface Plugin {
  _handleActions: any,
  hooks: PluginHooks,
  use: (plugin: any) => void,
  apply: (key: string, defaultHandler: Function) => Function,
  get: (key: string) => Array<PluginFn> | PluginEmit | PluginHooks,
}

// reducer action 部分
type GetPayLoad<T> = T extends { payload: infer P } ? P : undefined;

// or use Parameters
type GetParam<T> =
    T extends (arg: infer R) => any
    ? R
    : T extends () => any ? undefined : undefined;

type GetRestFuncType<T> = T extends (context: any, ...params: infer P) => infer R ? (...args: P) => R : never;

type Action<K, F, N = ''> = GetPayLoad<GetParam<GetRestFuncType<F>>> extends undefined
  ? {
    type: N extends string ? `${N}/${K & string}` : `${K & string}`
  }
  : {
    type: N extends string ? `${N}/${K & string}` : `${K & string}`,
    payload: GetPayLoad<GetParam<GetRestFuncType<F>>>
  }

type GetFunctionMapAction<M, N = ''> = {
  [K in keyof M]: Action<K, M[K], N>
}[keyof M];

type GetModelAction<T, K = ''> =
  T extends { namespace: infer N, reducers: infer R, effects: infer E }
  ? (GetFunctionMapAction<R, N> | GetFunctionMapAction<E, N>)
  : never;

type ActionMap<T> = {
  [K in keyof T]: GetModelAction<T[K], K>
}[keyof T];

// state 部分
/**
 * @description 将联合类型转换为交叉类型
 */
 type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never

type State<S, N> = N extends string ? { [key in N]: S } : never;

type GetModelState<T, K = ''> = T extends { namespace: infer N, state: infer S } ? State<S, N> : never;

type StateMap<T> = UnionToIntersection<{
  [K in keyof T]: GetModelState<T[K], K>
}[keyof T]>;

type Store<T> = {
  put: (action: ActionMap<T>) => Promise<any> | any,
  dispatch: (action: ActionMap<T>) => Promise<any> | any,
  getState: () => StateMap<T>,
  call: () => any,
  subscribe(listener: () => void): Unsubscribe;
  replaceReducer(nextReducer: Reducer<StateMap<T>, AnyAction>): void
  [Symbol.observable](): Observable<StateMap<T>>
}

// watch 部分
type Watch<T, R> = (
  selectFn: (state: StateMap<T>) => R,
  callback: (newValue: R, oldValue: R, diffCont: any) => void,
  options?: {
    compare?: ('default' | 'deepdiff'),
    immediate?: boolean,
  },
  initValue?: R,
) => Function;

type StoreExtend<T> = Store<T> & {
  watch?: Watch<T, any>;
  replaceReducer(nextReducer: Reducer<any, any>): void;
  asyncReducers?: ReducersMapObject<any, any>,
  effects?: EffectsMapObject,
}

export type DvaOption = Hooks & {
  namespacePrefixWarning?: boolean,
  initialState?: Object,
  onError?: Function,
  onReducer?: Function,
}

export type DvaCreateOption = {
  initialReducer?: any,
  setupMiddlewares?: (middlewares: Array<any>) => Array<any>,
  setupApp? (app: DvaInstance<any>): void,
}

export type Model<S> = {
  readonly namespace: string;
  state: S;
  reducers?: {
    [key: string]: (state: S, action: { payload: any }) => S,
  };
  effects?: {
    [key: string]: (store: EffectsCommandMap, action: { payload: any }) => void,
  };
  subscriptions?: SubscriptionsMapObject,
}

export type ModelMap<T> = T extends { [key: string]: Model<any> } ? T : any;

export interface DvaInstance<T> {
  _models: Array<Model<any>>,
  _store: StoreExtend<T>,
  _plugin: Plugin,
  /**
   * Register an object of hooks on the application.
   *
   * @param hooks
   */
  use: (hooks: Hooks) => void,

  /**
   * Register a model.
   *
   * @param model
   */
  model: (model: Model<any>) => void,

  /**
   * Unregister model.
   *
   * @param createReducer
   * @param reducers
   * @param unlisteners
   * @param namespace
   *
   * Unexpected key warn problem:
   * https://github.com/reactjs/redux/issues/1636
   */
  unmodel: (createReducer, reducers, unlisteners, namespace) => void,

  /**
   * Replace a model if it exsits, if not, add it to app
   * Attention:
   * - Only available after dva.start gets called
   * - Will not check origin m is strict equal to the new one
   * Useful for HMR
   * @param createReducer
   * @param reducers
   * @param unlisteners
   * @param onError
   * @param m
   */
  replaceModel: (createReducer, reducers, unlisteners, onError, m) => void,

  /**
   * Config router. Takes a function with arguments { history, dispatch },
   * and expects router config. It use the same api as react-router,
   * return jsx elements or JavaScript Object for dynamic routing.
   *
   * @param router
   */
  router?: (router: Router) => void,

  /**
   * Start the application. Selector is optional. If no selector
   * arguments, it will return a function that return JSX elements.
   *
   * @param selector
   */
  start: (selector?: HTMLElement | string) => any,

  /**
   * 
   */
  Provider: Provider,

  /**
   * 
   */
  connect: Connect<StateMap<T>>,

  /**
   * 
   */
  useDispatch: () => (action: ActionMap<T>) => Promise<any> | any,

  /**
   * 
   */
  useSelector: <S>(
    selector: (stateArea: StateMap<T>) => S,
    equalityFn?: (newVal: S, oldVal: S) => boolean,
  ) => S,

  /**
   * 
   */
  useStore: () => StoreExtend<T>,
}

declare function dva<T>(models: ModelMap<T>, opts?: DvaOption, createOpts?: DvaCreateOption): DvaInstance<T>;