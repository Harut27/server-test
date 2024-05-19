import { toast } from "react-toastify";


export const notify = (type, message) => {

    toast(message, {
        position: "bottom-right",
        autoClose: 25000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        type: type,
    });
};