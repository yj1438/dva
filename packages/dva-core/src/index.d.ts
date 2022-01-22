import {
  Reducer,
  ReducersMapObject,
  MiddlewareAPI,
  StoreEnhancer,
  Unsubscribe,
} from 'redux';

/**
 * @description 将联合类型转换为交叉类型
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never

export interface onActionFunc {
  (api: MiddlewareAPI<any>): void,
}

interface EffectsCommandMap {
  put: <A extends Action<any, any, any>>(action: A) => any,
  dispatch: <A extends Action<any, any, any>>(action: A) => any,
  getState: Function,
  call: Function,
  select: Function,
  [key: string]: any,
}

export type Effect = (action: Action<any, any, any>, effects: EffectsCommandMap) => void;

export type EffectsMapObject = {
  [key: string]: Effect,
}

export { Reducer,  ReducersMapObject };

export type ReducerEnhancer = {
  (reducer: Reducer<any>): void,
}

export interface Hooks {
  onError?: (e: Error, dispatch: Function) => void,
  onAction?: onActionFunc | onActionFunc[],
  onStateChange?: () => void,
  onReducer?: ReducerEnhancer,
  onEffect?: () => void,
  onHmr?: () => void,
  extraReducers?: ReducersMapObject,
  extraEnhancers?: StoreEnhancer<any>[],
}

export interface ActionContext{
  put: <A extends Action<any, any, any>>(action: A) => any,
  dispatch: <A extends Action<any, any, any>>(action: A) => any,
  call: Function,
  select: Function,
  [key: string]: any,
}

export interface SubscriptionAPI {
  // history: History,
  dispatch: Dispatch<any, any, any, any>,
}

export type Subscription = (api: SubscriptionAPI, done: Function) => void;

export interface SubscriptionsMapObject {
  [key: string]: Subscription,
}

export interface RouterAPI {
  // history: History,
  app: DvaInstance<any, any, any, any>,
}

export interface Router {
  (api?: RouterAPI): JSX.Element | Object,
}

export type PluginFn = (...args: any[]) => void;

export type PluginEmit = (r: Reducer) => Reducer;

export interface PluginHooks {
  [key: string]: Array<PluginFn>
}

export interface Plugin {
  _handleActions: any,
  hooks: PluginHooks,
  use: (plugin: any) => void,
  apply: (key: string, defaultHandler: Function) => Function,
  get: (key: string) => Array<PluginFn> | PluginEmit | PluginHooks,
}

type Action<N, R, E> = {
  type:
    | (N extends string ? `${N}/${keyof E & string}` : keyof E)
    | (N extends string ? `${N}/${keyof R & string}` : keyof R);
  payload?: any;
}

type Dispatch<N, S, R, E> = (action: Action<N, R, E>) => Promise<any> | S;

type GetState<N, S> = () => State<N, S>;

type Watch<N, S, T> = (
  selectFn: (state: State<N, S>) => T,
  callback: (newValue: T, oldValue: T, diffCont: any) => void,
  options?: {
    compare?: ('default' | 'deepdiff'),
    immediate?: boolean,
  },
  initValue?: T,
) => void;

type ModelState<N, S> = N extends string ? {
  [key in N]: S
} : never;

type State<N, S> = UnionToIntersection<ModelState<N, S>>

type StoreExtend<N, S, R, E> = {
  dispatch: Dispatch<N, S, R, E>;
  getState: GetState<N, S>;
  subscribe(listener: () => void): Unsubscribe;
  watch?: Watch<N, S, any>;
  replaceReducer(nextReducer: Reducer<S, any>): void;
  asyncReducers?: ReducersMapObject<S, any>,
  effects?: EffectsMapObject,
}

export type Model<N, S, R, E> = {
  readonly namespace: N;
  state: S;
  reducers?: R;
  effects?: E;
  subscriptions?: SubscriptionsMapObject,
};

export type ModelMap<N, S, R, E> = {
  [key: string]: Model<N, S, R, E>,
}

export type DvaOption = Hooks & {
  namespacePrefixWarning?: boolean,
  initialState?: Object,
}

export type DvaCreateOption = {
  initialReducer?: any,
  setupMiddlewares?: (middlewares: Array<any>) => Array<any>,
  setupApp? (app: DvaInstance<any, any, any, any>): void,
}

export interface DvaInstance<N, S, R, E> {
  _models: Array<Model<N, S, R, E>>,
  _store: StoreExtend<N, S, R, E>,
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
  model: (model: Model<any, any, any, any>) => void,

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
}
