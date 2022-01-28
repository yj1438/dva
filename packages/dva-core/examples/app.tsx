import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

export function App(props) {
  const count = useSelector(
    state => state.model1.count,
    (newValue, oldValue) => {
      console.log(`equalityFn exec ${newValue}---${oldValue}`);
      return newValue === oldValue;
    },
  );
  const dispatch = useDispatch();
  const clickHandle = () => {
    dispatch({ type: 'model1/update', payload: count + 1 });
  };

  return (
    <div>
      {count}
      <div onClick={clickHandle}>点击 + 1</div>
    </div>
  );
}
