import { createSlice, configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";

// Define your slices and their names
const slices = {

  // //for admin===
  // allAccounts: "allAccounts", //array
  // selected_allAccount: "selected_allAccount", //array
  // // =======

  // dumyState: "dumyState", //object
  // user: "user", //object
  // account: "account", //object

  // users: "users", //array

  // domains: "domains", //array

  // currency: "currency", //object
  // timeZone: "timeZone", //object


  // adTags: "adTags", //array
  // adPlacements: "adPlacements", //array
  // adTagConfigs: "adTagConfigs", //array
  // adPlcConfigs: "adPlcConfigs", //array
  // bidderLines: "bidderLines", //array
  // biddersConfigs: "biddersConfigs", //array
  // changeLogs: "changeLogs", //array
  // pendingChanges: "pendingChanges", //number

  // selected_user: "selected_user", //object
  // selected_domain: "selected_domain", //object
  // selected_adContainer: "selected_adContainer", //object
  // selected_adTag: "selected_adTag", //object
  // selected_adTagConfig: "selected_adTagConfig", //object
  // selected_adPlacement: "selected_adPlacement", //object
  // selected_adPlcConfig: "selected_adPlcConfig", //object
  // selected_bidderLine: "selected_bidderLine", //object
  // selected_biddersConfig: "selected_biddersConfig", //object
  // selected_changeLog: "selected_changeLog", //object

  exp_data: "exp_data", //object
  popup_data: "popup_data", //object
};

const slicesDefaultValues = {
  popup_data: JSON.stringify({
    isOpen: false,
    itsFor: "",
    title: "",
    message: "",
    data: {},
    callback: () => { },
    buttons: {
      confirm: false,
      cancel: false,
      edit: false,
      delete: false,
      addNew: false,
    }
  }),
};


// Function to generate reducersMain and store configurations
const generateConfigurations = (slices) => {
  const reducersMain = {
    states: {},
    actions: {},
  };

  const reducers = {};

  for (const [sliceName, sliceKey] of Object.entries(slices)) {
    let newVal;
    if (slicesDefaultValues[sliceKey]) {
      newVal = slicesDefaultValues[sliceKey];
    } else {
      newVal = "[]";
    }
    const slice = createSlice({
      name: sliceKey,
      initialState: { value: newVal },
      reducers: {
        [`set${sliceKey}`]: (state, action) => {
          state.value = action.payload;
        },
      },
    });

    reducersMain.states[sliceKey] = slice.reducer;
    reducersMain.actions[`set_${sliceKey}`] = slice.actions[`set${sliceKey}`];
    reducers[sliceKey] = slice.reducer;
  }

  const store = configureStore({
    reducer: reducers,
  });

  return { reducersMain, store };
};

// Generate the configurations using the slices object
export const { reducersMain, store } = generateConfigurations(slices);

