'use client';
import { useState, useEffect, useRef } from "react";
import { reduxState, useReduxDispatch } from '../../redux/customUtil';
import "./style.scss";

const dummyCallback = () => {
    console.log("dummyCallback");
};

const defaultProps = {
    isOpen: false,
    itsFor: "",
    title: "",
    message: "",
    data: {},
    callback: () => { },
    buttons: {
        confirm: true,
        cancel: true,
        edit: false,
        delete: false,
        addNew: false,
    }
};

export const PopupModal = (props) => {
    // console.log("PopupModal props: ", props);

    // const { isOpen, itsFor, title, message, data, callback, buttons } = props;
    // const [localData, setLocalData] = useState(defaultProps);

    const [isOpen, setIsOpen] = useState(props.isOpen || false);
    const [itsFor, setItsFor] = useState(props.itsFor || "");
    const [title, setTitle] = useState(props.title || "");
    const [message, setMessage] = useState(props.message || "");
    const [data, setData] = useState(props.data || {});
    // const callback = useRef(props.callback || dummyCallback);
    const [buttons, setButtons] = useState(props.buttons || defaultProps.buttons);


    const isInitial = useRef(true);
    const modalEl = useRef(null);
    const modalId = "popupModal";


    useEffect(() => {
        if (props.isOpen) {
            setIsOpen(true);
            setItsFor(props.itsFor);
            setTitle(props.title);
            setMessage(props.message);
            setData(props.data);
            // callback.current = props.callback;
            setButtons(props.buttons);
        }
    }, [props.isOpen]);



    function closeModal(action) {
        // console.log("isConfirmed: ", action);
        const confirmed = action === 'save' ? true : false;
        props.callback(confirmed);
        setIsOpen(false);
        setTitle("");
        setMessage("");
        setData({});
        setButtons(defaultProps.buttons);
    }



    function getModalClass() {
        let c = "custom-modal-1";
        if (isInitial.current && !isOpen) {
            c += ' hide';
        }

        if (isOpen) {
            c += ' show';
            isInitial.current = false;

        }

        if (!isInitial.current && !isOpen) {
            c += ' fade';
        }
        // console.log("getBackdropClass isOpen: ", isInitial.current, c);
        return c;
    }


    function getBackdropClass() {
        let c = "custom-modal-1-backdrop";
        if (isInitial.current && !isOpen) {
            c += ' hide';
        }

        if (!isInitial.current && isOpen) {
            c += ' show';
        }

        if (!isInitial.current && !isOpen) {
            c += ' hide';
        }

        return c;
    }

    return (
        <>
            <div className={getModalClass()}>
                <div className="custom-modal-1-header">
                    <div className="custom-modal-1-header-content">
                        <strong>{title}</strong>
                    </div>
                    <div className="custom-modal-1-header-close">
                        <button
                            onClick={() => { closeModal('dismiss') }}
                            type="button" className="btn-close" >

                        </button>
                    </div>
                </div>
                <div className="custom-modal-1-body">
                    {message}
                </div>
                <div className="custom-modal-1-footer">
                    {
                        buttons.cancel &&
                        <button
                            onClick={() => closeModal('dismiss')}
                            type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                            Cancel
                        </button>
                    }
                    {
                        buttons.confirm &&
                        <button
                            onClick={() => closeModal('save')}
                            type="button"
                            data-bs-dismiss="modal"
                            className={"btn btn-primary"}
                        >
                            Confirm
                        </button>
                    }
             
                </div>
            </div>
            <div className={getBackdropClass()}></div>
        </>
    )
};