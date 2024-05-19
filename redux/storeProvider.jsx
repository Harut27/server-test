'use client';
import { Provider } from "react-redux";
import { store } from "./reducers";

//this file is to use on next.js only, for react.js use it directly in app.jsx


export default function StoreProvider({ children }) {
    return (
        <Provider store={store}>
            {children}
        </Provider>
    );
}