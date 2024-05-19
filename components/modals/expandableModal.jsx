'use client';
import { useState, useEffect, useRef } from "react";
import { reduxState, useReduxDispatch } from '../../redux/customUtil';
import "./style.scss";
import { CodeEditor } from "../codeEditor/codeEditor";


const dummyCallback = () => {
    console.log("dummyCallback");
};

export const defaultExpProps = {
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

export const ExpandableModal = (props) => {
    // console.log("PopupModal props: ", props);

    // const { isOpen, itsFor, title, message, data, callback, buttons } = props;
    // const [localData, setLocalData] = useState(defaultExpProps);

    const [isOpen, setIsOpen] = useState(props.isOpen || false);
    const [itsFor, setItsFor] = useState(props.itsFor || "");
    const [title, setTitle] = useState(props.title || "");
    const [message, setMessage] = useState(props.message || "");
    const [data, setData] = useState(props.data || {});
    // const callback = useRef(props.callback || dummyCallback);
    const [buttons, setButtons] = useState(props.buttons || defaultExpProps.buttons);


    const isInitial = useRef(true);
    const modalEl = useRef(null);
    const modalId = "popupModal";

    //for code editor
    const editorRef = useRef();

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



    //save and close the modal
    function closeModal(action) {

        // console.log("isConfirmed: ", action);
        const confirmed = action === 'save' ? true : false;

        //for files
        let newData = { ...data };
        if (editorRef && editorRef.current) {
            const codeEditorStatesObj = editorRef.current.getLatestContent();
            if (confirmed) {
                const _newName = codeEditorStatesObj.name || data.name;
                const _newContent = codeEditorStatesObj.content || data.content;

                newData.newName = _newName;
                newData.content = _newContent;
            }
        }


        props.callback(confirmed, newData);
        setIsOpen(false);
        setTitle("");
        setMessage("");
        setData({});
        setButtons(defaultExpProps.buttons);
    }



    function getModalClass() {
        let c = "custom-exp-modal-1";
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
        let c = "custom-exp-modal-1-backdrop expandable";
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

    function handleSave() {

    }

    // console.log("ExpandableModal data: ", data);

    return (
        <>
            <div className={getModalClass()}>
                <div className="custom-exp-modal-1-header">
                    <div className="custom-exp-modal-1-header-content">
                        <strong>{title}</strong>
                    </div>
                    <div className="custom-exp-modal-1-header-actions">
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
                                Save
                            </button>
                        }

                    </div>
                    <div className="custom-exp-modal-1-header-close">
                        <button
                            onClick={() => { closeModal('dismiss') }}
                            type="button" className="btn-close" >

                        </button>
                    </div>
                </div>
                <div className="custom-exp-modal-1-body">
                    <div className="row mb-3">
                        <div className="col">
                            {message}
                        </div>
                    </div>
                    <div className="row">
                        {
                            data?.name && <div>
                                <div>
                                    Name
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={data.name}
                                        onChange={(e) => {
                                            setData({ ...data, name: e.target.value });
                                        }}
                                    />
                                </div>
                            </div>
                        }
                        {
                            data.type === 'file' &&
                            <div>
                                <div className="mt-3">
                                    Content
                                </div>
                                <div id="editor-container">
                                    <CodeEditor
                                        ref={editorRef}
                                        height="450px"
                                        file={data}
                                    />
                                </div>
                            </div>
                        }
                    </div>
                </div>
                <div className="custom-exp-modal-1-footer">

                </div>
            </div>
            <div className={getBackdropClass()}></div>
        </>
    )
};