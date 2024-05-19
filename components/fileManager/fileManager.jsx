'use client'
import { notify } from "../../util/notify/notifyMain";
import { excFetch } from "../../services/client/fetchClient";
import { useEffect, useState } from "react";
import "./style.scss"
import {
    MdFolder, MdOutlineFileOpen, MdOutlinePhotoSizeSelectActual,
    MdOutlinePhotoAlbum, MdOutlineTextSnippet, MdEdit, MdDelete,
    MdAdd,
    MdUpload
} from "react-icons/md";
import { ExpandableModal, defaultExpProps } from "../../components/modals/expandableModal";


const getPathSplited = (path) => {
    let splitted = path.split('/');
    splitted = splitted.filter((item) => item !== '');

    return splitted;
}

const sortFiles = (files) => {
    const folders = files.filter((item) => item.type === 'folder');
    const newFiles = files.filter((item) => item.type !== 'folder');
    return [...folders, ...newFiles];
}

const newFileSample = {
    name: '',
    type: 'file',
    content: '',
    path: ''
};

export default function FileManager(props) {
    const { intialPath } = props;

    const [isLoading, setIsLoading] = useState(true);
    const [currentPath, setCurrentPath] = useState(intialPath || '/var/www');
    const [currentPathSplited, setCurrentPathSplited] = useState(getPathSplited(currentPath));
    const [mainFiles, setMainFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [expProps, setExpProps] = useState(defaultExpProps);

    const [isCreating, setIsCreating] = useState(false);
    const [newItem, setNewItem] = useState({ ...newFileSample, path: currentPath });

    const fetchData = async (thePath, updateState) => {
        const d = {
            url: "/api/v1",
            method: "POST",
            body: JSON.stringify({
                all: false,
                action: "GET",
                itsFor: "files",
                itsForType: "services",
                itemKey: '/var/www',
                itemId: null,
                parentKey: null,
                parentId: null,
                data: { path: thePath }
            })
        }

        setIsLoading(true);
        const initalRes = await excFetch(d);

        if (initalRes.success && initalRes.data) {
            const srotedData = sortFiles(initalRes.data);
            setMainFiles(srotedData);
        }
        setIsLoading(false);


    }

    const updateData = async (_data, operation) => {
        let resObj = {
            success: false,
            message: "Failed to update data"
        };

        const d = {
            url: "/api/v1",
            method: "POST",
            body: JSON.stringify({
                all: false,
                action: "UPDATE",
                itsFor: "files",
                itsForType: "services",
                itemKey: '/var/www',
                operation: operation,
                itemId: null,
                parentKey: null,
                parentId: null,
                data: { ..._data }
            })
        }

        setIsLoading(true);
        const initalRes = await excFetch(d);

        if (initalRes.success && initalRes.data) {
            resObj = initalRes;
            notify("success", initalRes.message || "Data updated successfully");
            // let newMainFiles = [...mainFiles];
            // if(index !== null){
            //     newMainFiles[index] = _data;
            // }
            // setMainFiles(srotedData);
        }
        setIsLoading(false);


        return resObj;

    }

    useEffect(() => {
        fetchData(currentPath);
    }, []);

    useEffect(() => {
        setCurrentPathSplited(getPathSplited(currentPath));
        fetchData(currentPath);
    }, [currentPath]);

    const handleSelect = (file, index) => {
        if (!file || !file.type) {
            return;
        }
        const fileType = file.type;
        const isFolder = fileType === 'folder';
        const isAlreadySelected = selectedFile && selectedFile.index === index;

        //if folder on second clikc set the current path to it and fetch data
        if (isFolder && isAlreadySelected) {
            const newPath = `${currentPath}/${file.name}`;
            setCurrentPath(newPath);
        }

        //deselect if already selected anot not folder
        if (selectedFile && !isFolder && isAlreadySelected) {
            setSelectedFile(null);
            return;
        }

        let newFile = { ...file };
        newFile.index = index;
        setSelectedFile(newFile);
    };

    const handleEdit = async (file, index) => {
        // console.log("handleEdit: ", file, index);

        let newExpProps = { ...expProps };
        newExpProps.isOpen = true;
        newExpProps.itsFor = "fileEdit";
        newExpProps.title = "Edit File";
        newExpProps.message = "Edit File";
        newExpProps.data = file;
        newExpProps.callback = async (confirmed, data) => {
            if (confirmed) {
                // console.log("confirmed: ", confirmed, data);
                const r = await updateData(data, 'updateNameOrContent');
                if (r.success) {
                    const newMainFiles = [...mainFiles];
                    newMainFiles[index] = data;
                    setMainFiles(newMainFiles);
                }
            }
            setExpProps(defaultExpProps);
        }
        setExpProps(newExpProps);

    };

    const handleCreate = async (newItem) => {
        let i = { ...newItem };
        i.path = currentPath;

        const res = await updateData(i, 'create', null);
        if (res.success) {
            const newMainFiles = [...mainFiles, newItem];
            setMainFiles(newMainFiles);
            setNewItem(newFileSample);
            setIsCreating(false);
        }
    };

    const handleDelete = async (file, index) => {
        const res = await updateData(file, 'delete', index);
        if (res.success) {
            const newMainFiles = [...mainFiles];
            newMainFiles.splice(index, 1);
            setMainFiles(newMainFiles);
        }
    };



    return (
        <div className="">
            <div className="custom-card-3 file-manager-container" >
                <div className="file-manager-path">
                    {
                        currentPathSplited.map((item, index) => {
                            // console.log("item, index: ", item, index);
                            // console.log("currentPathSplited: ", currentPathSplited);
                            const isSelected = index === currentPathSplited.length - 1;
                            const className = isSelected ? 'file-manager-path-item active' : 'file-manager-path-item';
                            return (
                                <div key={index} className={className}>
                                    <span className="file-manager-path-item-sep">{'/'}</span>
                                    {
                                        isSelected ? (
                                            <span className="active">{item}</span>

                                        ) : (
                                            <a
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const newPath = '/' + currentPathSplited.slice(0, index + 1).join('/');
                                                    // console.log("newPath: ", newPath);
                                                    setCurrentPath(newPath);
                                                }}
                                            >{item}</a>
                                        )
                                    }
                                </div>
                            )
                        })
                    }
                </div>
                <div className="file-manager-content-actions">
                    <a
                        className="file-manager-content-actions-item"
                        onClick={(e) => {
                            e.preventDefault();
                            setIsCreating(true);
                        }}
                    >
                        <MdAdd
                            className="file-manager-content-actions-item-icon"
                        />
                    </a>
                    <a
                        className="file-manager-content-actions-item"
                        onClick={(e) => {
                            e.preventDefault();
                            setIsCreating(true);
                        }}
                    >
                        <MdUpload
                            className="file-manager-content-actions-item-icon"
                        />
                    </a>
                </div>
                {
                    isCreating && (
                        <div className="row d-flex file-manager-content-create">
                            <div className="col d-flex justify-content-end align-items-center">
                                <span style={{ opacity: '0.7', marginRight: '3px' }}>{currentPath + '/'}</span>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={newItem.name}
                                    onChange={(e) => {
                                        setNewItem({ ...newItem, name: e.target.value });
                                    }}
                                />
                            </div>
                            <div className="col d-flex  align-items-center">
                                <select
                                    style={{ width: '100px' }}
                                    className="form-control"
                                    value={newItem.type}
                                    onChange={(e) => {
                                        setNewItem({ ...newItem, type: e.target.value });
                                    }}
                                >
                                    <option value="file">File</option>
                                    <option value="folder">Folder</option>
                                </select>
                                <button
                                    className="btn btn-primary ml-1"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleCreate(newItem);
                                    }}
                                >
                                    Create
                                </button>
                                <button
                                    className="btn btn-primary ml-1 mr-1"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setIsCreating(false);
                                        setNewItem(newFileSample);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>

                        </div>
                    )
                }
                <div className="file-manager-content">

                    {
                        mainFiles.map((item, index) => {
                            const isFile = item.type === 'file';
                            const isFolder = item.type === 'folder';
                            const isSelected = selectedFile && selectedFile.index === index;
                            const itemClass = isSelected ? 'file-manager-content-item active' : 'file-manager-content-item';

                            return (
                                <div className={itemClass} key={index}>
                                    <button key={index} className="file-manager-content-item-btn-cnt" onClick={() => { handleSelect(item, index) }}>
                                        <div className="file-manager-content-item-icon">
                                            {
                                                isFile
                                                    ? <MdOutlineTextSnippet className="file-icon" />
                                                    : <MdFolder className="file-icon" />
                                            }
                                        </div>
                                        <div className="file-manager-content-item-name">
                                            {item.name}
                                        </div>
                                        {isFolder && isSelected &&
                                            <div className="file-manager-content-item-folder-mess">
                                                <span>click again to open</span>
                                            </div>
                                        }
                                    </button>
                                    {
                                        isSelected && (
                                            <div className="file-manager-content-item-actions">

                                                <a onClick={(e) => {
                                                    e.preventDefault();
                                                    handleEdit(item, index)
                                                }}>
                                                    <MdEdit />
                                                </a>
                                                <a onClick={(e) => {
                                                    e.preventDefault();
                                                    handleDelete(item, index)
                                                }}>
                                                    <MdDelete />
                                                </a>
                                            </div>
                                        )
                                    }
                                </div>
                            )
                        })
                    }
                </div>
            </div>
            <div className="col file-manager-sidebar">
            </div>
            <div className="col"></div>
            <ExpandableModal {...expProps} />
        </div>
    )
};