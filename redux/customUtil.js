import { useSelector, useDispatch } from "react-redux";
import { reducersMain } from "./reducers";

export function reduxState(stateName) {
  if (!stateName || stateName === null) {
    return [];
  }
  const state = useSelector((state) => state[stateName]?.value);
  // console.log('useReduxState', stateName,state);
  if (state.length > 0) {
    return JSON.parse(state);
  } else {
    return state;
  }
}

export function useReduxDispatch() {
  const dispatch = useDispatch();

  return function (stateName, value, actionType) {
    // console.log('useReduxDispatch', stateName, value);
    // const dispatch = useDispatch();
    if (actionType) {
      const actionType = actionType + stateName;
      const action = reducersMain.actions[actionType](JSON.stringify(value));
      return dispatch(action);
    } else {
      const actionType = "set_" + stateName;
      const action = reducersMain.actions[actionType](JSON.stringify(value));
      return dispatch(action);
    }
  };
}
