'use client'
import { useState, useEffect } from "react";
import Breadcrumb from "../../../components/breadcrumb/breadcrumb";
import Select from "react-select";
import Creatable, { useCreatable } from 'react-select/creatable';
import CopyInput from "../../../components/copyInput/copyInput";
import { excFetch } from "../../../services/client/fetchClient";
import { notify } from "../../../util/notify/notifyMain";
import { PopupModal } from '../../../components/modals/popupModal';

import { MdSquare, MdPlayArrow, MdOutlineReplay, MdDelete, MdEdit } from "react-icons/md";

import { validateDomainName, validateEmail } from "../../../util/validations/main";

const sampleProjectData = {
    type: "",
    deployApi: "",
    whiteListedIps: [],
    name: "",
    port: 0,
    domains: [],
    thisServerIP: "",
    projectEmail: "",
    installedApps: {
        active: false,
        nextjs: false,
        nextjsVersion: '',
        reactjs: false,
        reactjsVersion: '',
        nodejs: false,
        html: false,
        php: false,
    },
};

const sampleProjectProccessData = {
    id: 'n/a',
    name: '',
    namespace: '',
    version: '',
    mode: '',
    pid: '',
    uptime: '',
    restarts: '',
    status: '',
    cpu: '0%',
    mem: '0mb',
    user: '',
    watching: ''
}


const SamepleDomainData = {
    name: "",
    ssl: true,
    sslInstalled: false,
    letsEncrypt: true,
    fullchain: "",
    privkey: "",
}

const popupDataSample = {
    isOpen: false,
    itsFor: "",
    title: "",
    message: "",
    data: {},
    callback: () => { console.log("dummyCallback"); },
    buttons: {
        confirm: true,
        cancel: true,
        edit: false,
        delete: false,
        addNew: false,
    }
};


export default function Home({ params }) {
    const projectName = params.projectName;

    const [isLoading, setIsLoading] = useState(true);
    const [tempProjectData, setTempProjectData] = useState({});
    const [projectData, setProjectData] = useState(sampleProjectData);
    const [domains, setDomains] = useState([]);
    const [editingDomainIndex, setEditingDomainIndex] = useState(null);
    const [projectProccessData, setProjectProccessData] = useState(sampleProjectProccessData)

    const [isAddingNewDomain, setIsAddingNewDomain] = useState(false);
    const [newDomain, setNewDomain] = useState(SamepleDomainData);

    const [popupData, setPopupData] = useState(popupDataSample);

    //console.log("projectName: ", projectName);

    //set timeout for loading
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isLoading) {
                setIsLoading(false);
            }
        }, 2000);
    }, []);


    //fetch project data
    useEffect(() => {
        async function fetch() {
            const projectsReqConfig = {
                url: "/api/v1",
                method: "POST",
                body: JSON.stringify({
                    all: false,
                    action: "GET",
                    itsFor: "projects",
                    itsForType: "services",
                    itemKey: "name",
                    itemId: null,
                    parentKey: null,
                    parentId: null,
                    data: { name: projectName }
                })
            }

            setIsLoading(true);
            const response = await excFetch(projectsReqConfig);
            console.log("response", response);
            if (response.success) {
                setProjectData(response.data);
                if (response.data.proccessData) {
                    setProjectProccessData(response.data.proccessData);
                }
            }
            setIsLoading(false);
        }
        fetch();

    }, []);

    // console.log("projectData: ", projectData);
    const updateProjectData = async (_projectData, operation, _projectProccessData, isStateUpdate) => {

        const projectEmail = _projectData.projectEmail;
        if (projectEmail && projectEmail.length > 0) {
            const isValRes = validateEmail(projectEmail);
            if (!isValRes.status) {
                notify("error", isValRes.message || "Email is not valid");
                return;
            }
        }

        let resObj = {
            success: false,
            warning: false,
            message: ""
        }
        let projectsReqConfig = {
            url: "/api/v1",
            method: "POST",
            body: {
                all: false,
                action: "UPDATE",
                itsFor: "projects",
                itsForType: "services",
                itemKey: "name",
                itemId: projectName,
                parentKey: null,
                parentId: null,
                data: _projectData
            }
        };
        operation ? projectsReqConfig.body.operation = operation : null;
        projectsReqConfig.body = JSON.stringify(projectsReqConfig.body);

        setIsLoading(true);
        const response = await excFetch(projectsReqConfig);
        console.log("response", response);
        if (response.success) {
            if (response.warning) {
                resObj.warning = true;
                notify("warning", response.message);
            } else {
                notify("success", response.message || "Project data updated successfully");
            }

            resObj.message = response.message

            if (_projectData && isStateUpdate) {
                setProjectData(_projectData);
            }

            if (operation && _projectProccessData) {
                setProjectProccessData(_projectProccessData);
            }

            resObj.success = true;

        }
        setIsLoading(false);

        return resObj;
    }


    const handleSaveDomain = async () => {

        const isDomainOk = validateDomainName(newDomain.name);
        console.log("isDomainOk", isDomainOk);
        if (!isDomainOk.status) {
            notify("error", isDomainOk.message || "Domain name is not valid");
            return;
        }

        if (isAddingNewDomain) {
            let d = { ...newDomain };
            d.projectName = projectName;
            d.fullchain = d.fullchain;
            d.privkey = d.privkey;
            const operation = 'addDomain';
            const r = await updateProjectData(d, operation, null, false)
            if (r.success) {
                setNewDomain(SamepleDomainData);
                setIsAddingNewDomain(false);

                //add domain to projectData
                const newProjectData = { ...projectData };
                newProjectData.domains.push(d);
                setProjectData(newProjectData);
                // if (r.warning) {
                //     notify("warning", r.message);
                // }
            }

        } else {
            setIsAddingNewDomain(true);
            setNewDomain(SamepleDomainData)
        }
    };

    const getAppRunningObj = () => {
        let o = {
            status: false,
            title: "No app is running",
            buttonTitle: "Start App"
        }

        if (projectData.installedApps.active && projectData.installedApps.nextjs) {
            o.status = true;
            o.title = "Next.js app is running";
        }

        if (projectData.installedApps.active && !projectData.installedApps.nextjs) {
            o.status = true;
            o.title = "Node app is running";
        }

        o.buttonTitle = o.status ? "Stop App" : "Start App";
        return o;
    }

    const handleConfirm = (title, message, type, data, callback) => {
        // console.log("handleConfirm: ", title, message, type, data);

        let pd = { ...popupDataSample };
        pd.isOpen = true;
        pd.title = title;
        pd.message = message;
        pd.callback = (confirmed) => {
            // console.log("confirmed: ", confirmed);
            if (confirmed) {
                callback(type, data);
            }
            setPopupData(popupDataSample);
        };
        setPopupData(pd);
    };

    const handleDeleteDomain = (type, data) => {
        console.log("handleDeleteDomain: ", type, data);
        if (type === 'domain') {
            let newProjectData = { ...projectData };
            newProjectData.domains = newProjectData.domains.filter(d => d.name !== data.name);
            updateProjectData(newProjectData, null, null, true);
        }
    }

    const handleUpdateSSl = (type, data) => {
        console.log("handleUpdateSSl: ", type, data);
        if (type === 'domain') {
            let newProjectData = { ...projectData };
        }
    }


    // console.log("projectData: ", projectData);
    return (
        <div className="container-xxl container-main">
            <div className="row">
                <Breadcrumb />
            </div>
            <div className="row">
                <h1>{projectName}</h1>
            </div>

            <div className={"custom-card-3" + (isLoading ? ' loading' : '') + (projectData.installedApps.nodejs ? '' : ' disabled')}>

                {
                    !projectData.installedApps.nodejs &&
                    <div className="row">
                        <div className="col">
                            <div className="alert alert-secondary" role="alert">
                                applicable for node.js projects only
                            </div>
                        </div>
                    </div>
                }
                <div className="row mb-3">
                    <div className="d-flex">
                        <span className="mr-1">
                            {'CPU '}
                            <strong>{(projectProccessData.cpu || '0%')}</strong>
                        </span>
                        <span className="mr-1">
                            {'Memory(RAM) '}
                            <strong>{projectProccessData.mem || '0mb'}</strong>
                        </span>
                        {/* <span className="mr-1">
                            {'Disk '}
                            <strong>{bytesToMb(databaseDataLocal.disk)}</strong>
                        </span> */}
                    </div>
                </div>
                <div className="row d-flex flex-column">
                    <div className="col d-flex">
                        {
                            projectData.installedApps.nodejs && projectProccessData.status === 'online' &&
                            <span className="badge text-bg-success d-flex align-items-center">
                                Project is Running
                            </span>
                        }
                        {
                            projectData.installedApps.nodejs && projectProccessData.status !== 'online' &&
                            <span className="badge text-bg-secondary d-flex align-items-center">
                                Project is Stopped
                            </span>
                        }
                        <button
                            onClick={() => {
                                const a = projectProccessData.status === 'online' ? 'stop' : 'start';

                                let newProjectProccessData = { ...projectProccessData };
                                newProjectProccessData.status = a === 'start' ? 'online' : 'offline';
                                updateProjectData(projectData, a, newProjectProccessData, true)
                            }}
                            className="btn btn-light mr-1 ml-1"
                            disabled={!projectData.installedApps.nodejs}
                        >
                            {
                                projectProccessData.status === 'online'
                                    ? <MdSquare className="action-icon" />
                                    : <MdPlayArrow className="action-icon" />
                            }
                        </button>
                        <button
                            onClick={() => {
                                const a = projectProccessData.status === 'online' ? 'restart' : 'start';
                                let newProjectProccessData = { ...projectProccessData };
                                newProjectProccessData.status = a === 'start' ? 'online' : 'offline';
                                updateProjectData(projectData, a, newProjectProccessData, true)
                            }}
                            className="btn btn-light mr-1"
                            disabled={!projectData.installedApps.nodejs}
                        >
                            {
                                projectProccessData.status === 'online'
                                    ? <MdOutlineReplay className="action-icon" />
                                    : <MdOutlineReplay className="action-icon" />
                            }
                        </button>

                    </div>

                    {/* <div className="col d-flex justify-content-start align-items-center">
                        <div className="d-flex flex-column">
                            <span
                                className={"badge rounded-pill text-" + (getAppRunningObj().status ? " bg-success" : " bg-danger")}
                            >
                                {getAppRunningObj().title}
                            </span>
                            <button
                                className={"btn mt-3" + (getAppRunningObj().status ? " btn-danger" : " btn-success")}
                                onClick={() => {
                                    let newProjectData = { ...projectData };
                                    newProjectData.installedApps.active = !newProjectData.installedApps.active;
                                    updateProjectData(newProjectData)
                                }}
                            >
                                {getAppRunningObj().buttonTitle}
                            </button>
                        </div>
                    </div> */}
                    <div className="col mt-4">
                        <span>
                            Installed Apps
                        </span>
                    </div>
                    <div className="col d-flex">

                        <div className={"custom-card-2 no-action"}>
                            <div className="cr2-logo">
                                <img src="/images/other/nextjs-logo.svg" alt="" />
                            </div>
                            <div className="cr2-title">
                                <span>Next.js</span>
                            </div>
                            <div className={"cr2-status" + (isLoading ? " loading" : "")}>
                                <span
                                    className={"status-cyrcle-" + (projectData.installedApps.nextjs ? "success" : "info")}
                                ></span>
                                <span className="status-text">
                                    {projectData.installedApps.nextjs ? "installed" : "not installed"}
                                </span>
                            </div>
                        </div>
                        <div className={"custom-card-2 no-action"}>
                            <div className="cr2-logo">
                                <img src="/images/other/react-logo.svg" alt="" />
                            </div>
                            <div className="cr2-title">
                                <span>react.js</span>
                            </div>
                            <div className={"cr2-status" + (isLoading ? " loading" : "")}>
                                <span
                                    className={"status-cyrcle-" + (projectData.installedApps.reactjs ? "success" : "info")}
                                ></span>
                                <span className="status-text">
                                    {projectData.installedApps.reactjs ? "installed" : "not installed"}
                                </span>
                            </div>
                        </div>
                        <div className={"custom-card-2 no-action"}>
                            <div className="cr2-logo">
                                <img src="/images/other/nodejs-icon.svg" alt="" />
                            </div>
                            <div className="cr2-title">
                                <span>node.js</span>
                            </div>
                            <div className={"cr2-status" + (isLoading ? " loading" : "")}>
                                <span
                                    className={"status-cyrcle-" + (projectData.installedApps.nodejs ? "success" : "info")}
                                ></span>
                                <span className="status-text">
                                    {projectData.installedApps.nodejs ? "installed" : "not installed"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="col">
                        <span>
                            If any of the above is detected in deployment then reactPanel will run
                            <strong style={{marginLeft:'3px',marginRight:'3px'}}>
                                install, build and start(with pm2 ecosystem file)
                            </strong>
                            after each deployment.
                        </span>
                    </div>


                </div>
            </div>

            <div className={"custom-card-3" + (isLoading ? " loading" : "")}>
                <div className="row mb-2">
                    <div className="row">
                        <div className="col d-flex align-items-cente">
                            <span style={{ width: '120px' }}>
                                Local link
                            </span>
                            <a
                                className=""
                                target="_blank"
                                href={"http://" + projectData.thisServerIP + ":" + projectData.port}
                            >
                                {projectData.thisServerIP + ":" + projectData.port}
                            </a>
                        </div>
                        <div className="col d-flex justify-content-end align-items-start">
                            <div>
                                <button
                                    style={{ width: '120px' }}
                                    className="btn btn-primary"
                                    onClick={() => { updateProjectData(projectData, null, null, true) }}
                                >
                                    Save
                                </button>
                            </div>
                        </div>

                    </div>
                    <div className="row mb-4">
                        <div className="col d-flex align-items-center">
                            <span style={{ width: '120px' }}>
                                Project Email
                            </span>
                            <input
                                style={{ width: '300px' }}
                                type="text"
                                className="form-control"
                                value={projectData.projectEmail || ""}
                                onChange={
                                    (e) => {
                                        let newProjectData = { ...projectData };
                                        newProjectData.projectEmail = e.target.value;
                                        setProjectData(newProjectData);
                                    }
                                }

                            />
                            <span className="ml-1">
                                Email will be used for SSL related notifications and alerts only
                            </span>
                        </div>
                    </div>
                    <div className="row mb-5 d-flex flex-column">
                        <div className="col d-flex align-items-center">
                            <h5>Port</h5>

                        </div>
                        <div className="col">
                            <input
                                style={{ width: '300px' }}
                                disabled={true}
                                type="text"
                                className="form-control"
                                value={projectData.port}
                            />
                            <span>Use this port in your nextJS,ReactJS or any nodeJS Project</span>

                        </div>
                    </div>
                    <div className="row mb-5 d-flex flex-column">
                        <div className="col d-flex align-items-center">
                            <h5>Deploy API</h5>

                        </div>
                        <div className="col align-items-center">
                            <div style={{ width: "600px" }}>
                                <CopyInput value={projectData.deployApi} />
                            </div>
                            {/* <span >Use this port in your nextJS,ReactJS or any nodeJS Project</span> */}
                            <div className="mt-3">
                                <span>Whitelisted IPs for deployment</span>
                                <Creatable
                                    instanceId={"whiteListedIps"}
                                    placeholder="Add Whitelisted IPs"
                                    style={{ width: '300px' }}
                                    isMulti
                                    value={
                                        projectData.whiteListedIps
                                            ? projectData.whiteListedIps.map(ip => {
                                                return { value: ip, label: ip }
                                            })
                                            : []
                                    }
                                    onChange={
                                        (e) => {
                                            const vallsArr = e.map(val => val.value);
                                            let newProjectData = { ...projectData };

                                            const trimedArr = vallsArr.map(val => val.trim());
                                            newProjectData.whiteListedIps = trimedArr;
                                            // console.log("newProjectData", newProjectData);
                                            setProjectData(newProjectData);
                                        }
                                    }

                                />
                            </div>
                        </div>
                    </div>
                    <div className="row mb-5 d-flex flex-column">
                        <div className="col mb-2">
                            <div className="d-flex align-items-center">
                                <div>
                                    <h5 className="mr-2">Domains</h5>
                                </div>
                            </div>
                        </div>
                        <div className="col mb-3">
                            <div className="">
                                <button
                                    style={{ width: '150px' }}
                                    className="btn btn-primary"
                                    onClick={() => {
                                        if (!isAddingNewDomain) {
                                            setIsAddingNewDomain(true);
                                        } else {
                                            handleSaveDomain();
                                        }
                                    }}
                                >
                                    {
                                        isAddingNewDomain ? 'Save' : 'New Domain'
                                    }
                                </button>
                                {
                                    isAddingNewDomain &&
                                    <button
                                        style={{ width: '120px', marginLeft: '10px' }}
                                        className="btn btn-danger ml-3"
                                        onClick={() => {
                                            setIsAddingNewDomain(false);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                }
                            </div>
                        </div>

                        {isAddingNewDomain &&
                            <div className="col">
                                <div className="row d-flex flex-column border-bottom border-top ">
                                    <div className="col d-flex align-items-center mb-2 mt-2">
                                        <input
                                            placeholder="example.com"
                                            style={{ width: '300px' }}
                                            type="text"
                                            className="form-control"
                                            value={newDomain.name}
                                            onChange={
                                                (e) => {
                                                    let newDomainData = { ...newDomain };
                                                    newDomainData.name = e.target.value;
                                                    setNewDomain(newDomainData);
                                                }
                                            }
                                        />

                                        <div className="ml-1">
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    role="switch"
                                                    checked={newDomain.ssl}
                                                    onChange={
                                                        (e) => {
                                                            let newDomainData = { ...newDomain };
                                                            newDomainData.ssl = e.target.checked;
                                                            setNewDomain(newDomainData);
                                                        }
                                                    }
                                                />
                                                <span>
                                                    enable SSL(https)
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-1">
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    role="switch"
                                                    checked={newDomain.letsEncrypt}
                                                    onChange={
                                                        (e) => {
                                                            let newDomainData = { ...newDomain };
                                                            newDomainData.letsEncrypt = e.target.checked;
                                                            setNewDomain(newDomainData);
                                                        }
                                                    }
                                                />
                                                <span>
                                                    use letsEncrypt
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-1">
                                            {newDomain.sslInstalled &&
                                                <span className="badge bg-success">SSL Installed</span>
                                            }
                                            {
                                                !newDomain.sslInstalled &&
                                                <span className="badge bg-secondary">SSL Not Installed</span>
                                            }
                                        </div>

                                    </div>
                                    <div className="col">
                                        <span>Make sure there is A record pointing to this server ip for SSL to work</span>
                                    </div>
                                    {!newDomain.letsEncrypt && newDomain.ssl &&
                                        <div className="col">
                                            <div className="row">
                                                <div className="col d-flex flex-column ">
                                                    <span>SSL Full Chain</span>
                                                    <textarea
                                                        style={{ fontSize: '11px' }}
                                                        className="form-control"
                                                        name="" id="" cols="30" rows="10"
                                                        value={newDomain.fullchain}
                                                        onChange={
                                                            (e) => {
                                                                let newDomainData = { ...newDomain };
                                                                newDomainData.fullchain = e.target.value;
                                                                setNewDomain(newDomainData);
                                                            }
                                                        }
                                                    />
                                                </div>
                                                <div className="col d-flex flex-column ">
                                                    <span>SSL Private Key</span>
                                                    <textarea
                                                        style={{ fontSize: '11px' }}
                                                        className="form-control"
                                                        name="" id="" cols="30" rows="10"
                                                        value={newDomain.privkey}
                                                        onChange={
                                                            (e) => {
                                                                let newDomainData = { ...newDomain };
                                                                newDomainData.privkey = e.target.value;
                                                                setNewDomain(newDomainData);
                                                            }
                                                        }
                                                    />
                                                </div>

                                            </div>
                                            <div className="ml-1">

                                            </div>
                                        </div>
                                    }
                                </div>
                            </div>
                        }
                        <div className="col">
                            {projectData.domains && projectData.domains.length > 0 &&
                                projectData.domains.map((domain, index) => {
                                    // console.log("domain: ", index, domain);
                                    return (
                                        <div key={index} className="row d-flex flex-column border-bottom borrder-top">
                                            <div className="col mb-1 mt-1">
                                                <div className="row">
                                                    <div className="col-3">
                                                        <div className="">
                                                            <input
                                                                disabled={true}
                                                                placeholder="example.com"
                                                                // style={{ width: '250px' }}
                                                                type="text"
                                                                className="form-control"
                                                                value={domain.name}
                                                                onChange={() => { }}
                                                            />
                                                        </div>
                                                    </div>


                                                    <div className="col d-flex flex-column align-items-center justify-content-center">
                                                        <div className="">
                                                            {projectData.domains[index].sslInstalled &&
                                                                <span className="badge bg-success">SSL Installed</span>
                                                            }
                                                            {
                                                                !projectData.domains[index].sslInstalled &&
                                                                <div className="d-flex align-items-center">
                                                                    <span className="badge bg-secondary">SSL Not Installed</span>
                                                                </div>
                                                            }

                                                        </div>
                                                    </div>
                                                    <div className="col d-flex align-items-center justify-content-end">
                                                        {editingDomainIndex === index &&
                                                            <button
                                                                className="btn btn-danger btn-sm ml-1"
                                                                onClick={() => {
                                                                    setEditingDomainIndex(null);
                                                                    let newProjectData = { ...projectData };
                                                                    newProjectData.domains = newProjectData.domains.filter((d, i) => i !== index);
                                                                    updateProjectData(newProjectData, 'deleteDomain', null, true);
                                                                }}
                                                            >Delete
                                                            </button>
                                                        }
                                                        {editingDomainIndex === index &&
                                                            <button
                                                                className="btn btn-primary btn-sm ml-1"
                                                                onClick={() => {
                                                                    setEditingDomainIndex(null);
                                                                    setProjectData(tempProjectData);
                                                                }}
                                                            >Cancel
                                                            </button>
                                                        }
                                                        <button
                                                            className="btn btn-primary btn-sm ml-1"
                                                            onClick={() => {
                                                                if (editingDomainIndex !== index) {
                                                                    setEditingDomainIndex(index);
                                                                    setTempProjectData(JSON.parse(JSON.stringify(projectData)));
                                                                } else {
                                                                    // setEditingDomainIndex(null);
                                                                    //update project data
                                                                    console.log("projectData: ", projectData);
                                                                    const domainData = projectData.domains[index];
                                                                    const res = updateProjectData(domainData, 'updateDomain', null, false);
                                                                    // if (!res.success) {
                                                                    //     setProjectData(tempProjectData);
                                                                    // }
                                                                }
                                                            }}
                                                        >
                                                            {
                                                                editingDomainIndex === index ? 'Save' : <MdEdit />
                                                            }

                                                        </button>

                                                    </div>

                                                </div>
                                                {
                                                    editingDomainIndex === index &&
                                                    <>
                                                        <div className="row mt-3 d-flex flex-row">
                                                            <div className="col">
                                                                <ul>
                                                                    <li>
                                                                        <span>To install custom SSL disable LetsEncript</span>
                                                                    </li>
                                                                    <li>
                                                                        <span>To trigger LetsEncript or custom SSL reinstall just save, if its faild or not installed</span>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </div>
                                                        <div className="row mt-2 mb-2 d-flex flex-row">
                                                            <div className="col d-flex">
                                                                <div className="form-check form-switch d-flex flex-column align-items-center">
                                                                    <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
                                                                        enable SSL(https)
                                                                    </span>
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        role="switch"
                                                                        checked={projectData.domains[index].ssl}
                                                                        onChange={
                                                                            (e) => {
                                                                                let newProjectData = JSON.parse(JSON.stringify(projectData));
                                                                                newProjectData.domains[index].ssl = e.target.checked;
                                                                                setProjectData(newProjectData);
                                                                            }
                                                                        }
                                                                    />

                                                                </div>
                                                                <div className="form-check form-switch d-flex flex-column align-items-center">
                                                                    <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
                                                                        use letsEncrypt
                                                                    </span>
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        role="switch"
                                                                        checked={projectData.domains[index].letsEncrypt}
                                                                        onChange={
                                                                            (e) => {
                                                                                let newProjectData = JSON.parse(JSON.stringify(projectData));
                                                                                newProjectData.domains[index].letsEncrypt = e.target.checked;
                                                                                setProjectData(newProjectData);
                                                                            }
                                                                        }
                                                                    />

                                                                </div>
                                                            </div>

                                                        </div>
                                                        {
                                                            !projectData.domains[index].letsEncrypt && projectData.domains[index].ssl &&
                                                            <div className="row">
                                                                <div className="col d-flex flex-column ">
                                                                    <span>SSL Full Chain</span>
                                                                    <textarea
                                                                        className="form-control"
                                                                        name="" id="" cols="30" rows="10"
                                                                        value={projectData.domains[index].fullchain}
                                                                        onChange={
                                                                            (e) => {
                                                                                let newProjectData = JSON.parse(JSON.stringify(projectData));
                                                                                newProjectData.domains[index].fullchain = e.target.value;
                                                                                setProjectData(newProjectData);
                                                                            }
                                                                        }
                                                                    />
                                                                </div>
                                                                <div className="col d-flex flex-column ">
                                                                    <span>SSL Private Key</span>
                                                                    <textarea
                                                                        className="form-control"
                                                                        name="" id="" cols="30" rows="10"
                                                                        value={projectData.domains[index].privkey}
                                                                        onChange={
                                                                            (e) => {
                                                                                let newProjectData = JSON.parse(JSON.stringify(projectData));
                                                                                newProjectData.domains[index].privkey = e.target.value;
                                                                                setProjectData(newProjectData);
                                                                            }
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>
                                                        }
                                                    </>
                                                }
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>

                    </div>
                </div>

            </div>
            <PopupModal
                isOpen={popupData.isOpen}
                itsFor={popupData.itsFor}
                title={popupData.title}
                message={popupData.message}
                data={popupData.data}
                callback={popupData.callback}
                buttons={popupData.buttons}
            />
        </div>
    );
}