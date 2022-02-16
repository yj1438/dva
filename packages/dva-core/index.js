import { Provider, connect, useSelector, useDispatch, useStore } from 'react-redux';
import { create } from './src/index';

export function dva(models, opts = {}) {
  const app = create(opts);

  for (const key in models) {
    if (Object.prototype.hasOwnProperty.call(models, key)) {
      app.model(models[key]);
    }
  }

  app.start();

  //
  app.Provider = Provider;
  app.connect = connect;
  app.useStore = useStore;
  app.useDispatch = useDispatch;
  app.useSelector = useSelector;

  return app;
}
