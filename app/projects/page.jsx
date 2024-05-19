'use client'
import { useState, useEffect } from "react";
import { SimpleTable } from '../../components/tables/table';
import { excFetch } from "../../services/client/fetchClient";
import { notify } from "../../util/notify/notifyMain";
import { validateProjectName } from "../../util/validations/main";
import { PopupModal } from '../../components/modals/popupModal';
import Breadcrumb from "../../components/breadcrumb/breadcrumb";



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

export default function Home() {
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingNewProject, setIsLoadingNewProject] = useState(false);
    const [projects, setProjects] = useState([]);
    const [popupData, setPopupData] = useState(popupDataSample);

    const [newProjectData, setNewProjectData] = useState({
        name: "",
        path: ""
    });

    useEffect(() => {
        async function fetch() {
            console.log("fetchinging projects ...");
            const projectsReqConfig = {
                url: "/api/v1",
                method: "POST",
                body: JSON.stringify({
                    all: true,
                    action: "GET",
                    itsFor: "projects",
                    itsForType: "services",
                    itemKey: null,
                    itemId: null,
                    parentKey: null,
                    parentId: null
                })
            }

            setIsLoading(true);
            const response = await excFetch(projectsReqConfig);
            // console.log("response", response);
            if (response.success) {
                setProjects(response.data);
            }
            setIsLoading(false);
        }
        fetch();

    }, []);


    const handleConfirm = (title, message, type, data, callback) => {
        // console.log("handleConfirm: ", title, message, type, data);

        let pd = { ...popupDataSample };
        pd.isOpen = true;
        pd.title = title;
        pd.message = message;
        pd.callback = (confirmed) => {
            // console.log("confirmed: ", confirmed, type, data);
            if (confirmed) {
                callback(data);
            }
            setPopupData(popupDataSample);
        };
        setPopupData(pd);
    };


    const handleCreateNewProject = async () => {
        const isValidRes = validateProjectName(newProjectData.name);


        if (!newProjectData.name) {
            notify("error", "Project name is required");
            return;
        }


        if (!isValidRes.status) {
            notify("error", isValidRes.message);
            return;
        }

        const newProjectReqConfig = {
            url: "/api/v1",
            method: "POST",
            body: JSON.stringify({
                action: "CREATE",
                itsFor: "projects",
                itsForType: "services",
                itemKey: "name",
                itemId: newProjectData.name,
                parentKey: null,
                parentId: null,
                data: newProjectData
            })
        }

        setIsLoadingNewProject(true);
        const response = await excFetch(newProjectReqConfig);
        console.log("response", response);
        if (response.success) {
            notify("success", "Project created successfully");
            let newProjects = [...projects];
            newProjects.push({
                name: newProjectData.name,
                path: `/var/www/${newProjectData.name}`
            });

            setProjects(newProjects);
        }
        setNewProjectData({ name: "", path: "" })
        setIsLoadingNewProject(false);
    }

    const handleDeleteProject = async (project) => {
        const deleteProjectReqConfig = {
            url: "/api/v1",
            method: "POST",
            body: JSON.stringify({
                action: "DELETE",
                itsFor: "projects",
                itsForType: "services",
                itemKey: "name",
                itemId: project.name,
                parentKey: null,
                parentId: null,
                data: project
            })
        }

        setIsLoading(true);
        const response = await excFetch(deleteProjectReqConfig);
        console.log("response", response);
        if (response.success) {
            notify("success", "Project deleted successfully");
            let newProjects = projects.filter(p => p.name !== project.name);
            setProjects(newProjects);
        }
        setIsLoading(false);
    }

    return (
        <div className="container-xxl container-main">
            <div className="row">
                <Breadcrumb />
            </div>
            <div className="custom-card-3">
                <div className="row">
                    <h6>Create Project</h6>
                </div>
                <div className="row">
                    <div className="col ">
                        <input type="text"
                            value={newProjectData.name}
                            className="form-control mr-1"
                            placeholder="project name"
                            onChange={(e) => {
                                setNewProjectData({ ...newProjectData, name: e.target.value })
                            }}
                        />
                    </div>
                    <div className="col">
                        <button
                            disabled={isLoadingNewProject}
                            className="btn btn-primary"
                            onClick={() => {
                                handleCreateNewProject();
                            }}
                        >
                            Create
                            {isLoadingNewProject &&
                                <div className="spinner-grow ml-03 spinner-grow-sm text-warning" role="status">
                                </div>
                            }
                        </button>
                    </div>
                </div>
            </div>
            <div className="row">
                <SimpleTable
                    itsFor="projects"
                    data={projects}
                    buttons={{
                        edit: false,
                        delete: true,
                        addNew: false,
                        changePassword: false,
                        deleteUser: false,
                        projectDetails: true,
                        deleteCallback: (data) => {
                            // console.log("delete db", data);
                            handleConfirm(
                                'Delete Project',
                                'Are you sure you want to delete this project?',
                                'delete',
                                data,
                                handleDeleteProject
                            );
                        },

                        // changePasswordCallback: (data) => {
                        //     // console.log("changePasswordCallback", data);
                        //     handleChangeDbUserPassword(data);
                        // }
                    }}
                />
            </div>

            <div>
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
        </div>
    );
}