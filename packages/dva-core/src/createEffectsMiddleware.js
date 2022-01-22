import warning from 'warning';
import { NAMESPACE_SEP } from './constants';

export default function createEffectsMiddleware(app, onEffect, onError) {
  return ({ dispatch, getState }) => next => action => {
    const store = app._store;
    let effect = store.effects[action.type];
    if (effect) {
      const [namespace] = action.type.split(NAMESPACE_SEP);
      const actionContext = {
        select: selector => selector(getState()),
        call: (fn, ...args) => {
          warning(true, '[deprecate] please directly call fn(...args).');
          return fn(...args);
        }, // 不建议使用
        put: action => {
          warning(
            action.type.indexOf(`${namespace}${NAMESPACE_SEP}`) !== 0,
            `[put] ${action.type} should not be prefixed with namespace ${namespace}`,
          );
          warning(true, '[deprecate] please use api dispatch.');
          return actionContext.dispatch(action);
        }, // 不建议使用
        getState,
        dispatch: _action => {
          if (_action.type.split(NAMESPACE_SEP).length === 1) {
            _action.type = `${namespace}${NAMESPACE_SEP}${_action.type}`;
          }
          Object.defineProperty(_action, '__inner_effect__', { value: true });
          return dispatch(_action);
        },
      };
      if (!action.__inner_effect__ && onEffect.length) {
        const model = app._models.filter(m => m.namespace === namespace)[0];
        for (const fn of onEffect) {
          const _effect = effect;
          const effectWithCatch = (...args) =>
            Promise.resolve(_effect(...args)).catch(error => {
              onError(error, action);
            });
          effect = fn(effectWithCatch, actionContext, model, action.type);
        }
      }

      try {
        return Promise.resolve(effect(actionContext, action)).catch(error => {
          onError(error, action);
        });
      } catch (error) {
        onError(error, action);
      }
    }
    return next(action);
  };
}
