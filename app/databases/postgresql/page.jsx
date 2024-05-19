'use client';
import Image from "next/image";
import { usePathname } from "next/navigation";
import { excFetch } from "../../../services/client/fetchClient";

import { useState, useEffect } from "react";
import { getBreadcrumbFromPath } from "../../../util/breadcrumb/breadcrumb";
import { reduxState, useReduxDispatch } from '../../../redux/customUtil';
import { PopupModal } from '../../../components/modals/popupModal';
import { SimpleTable } from '../../../components/tables/table';
import { notify } from "../../../util/notify/notifyMain";
import { validateDbname } from '../validations';
import CopyInput from '../../../components/copyInput/copyInput';

import Select from 'react-select'


import {
  MdClose, MdEdit, MdOutlineRemoveRedEye, MdSave,
  MdSquare, MdCropSquare, MdPlayArrow,
  MdOutlineReplay

} from "react-icons/md";
import { connect } from "react-redux";


const dbExcludeList = ['information_schema', 'mysql', 'performance_schema', 'sys'];
const dbUserExcludeList = ['root', 'mysql.sys', 'mysql.session', 'mysql', 'debian-sys-maint', 'mysql.infoschema'];


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
  const dispatch = useReduxDispatch();
  const pageServiceType = "databases";
  const pageServiceName = "postgresql";
  const path = usePathname();
  const breadcrumbs = getBreadcrumbFromPath(path);

  const accessToken = 'aaaaaaa';

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNewDb, setIsLoadingNewDb] = useState(false);
  const [isLoadingNewUser, setIsLoadingNewUser] = useState(false);
  const [isLoadingAddUserToDb, setIsLoadingAddUserToDb] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const [newDbUser, setNewDbUser] = useState({ name: '', password: '' });
  const [newDbData, setNewDbData] = useState({ name: '', password: '' });
  const [newUserToDbData, setNewUserToDbData] = useState({ dbName: '', user: '' });

  const [databaseDataLocal, setdatabaseDataLocal] = useState({ active: false, installed: false });
  const [databases, setDatabases] = useState([]);
  const [popupData, setPopupData] = useState(popupDataSample);
  const [dbUsers, setDbUsers] = useState([]);

  const [postgreSqlAccessData, setPostgreSqlAccessData] = useState({
    dbName: '',
    port: '',
    connectionString: '',
    user: '',
    password: ''
  });

  const [inprogressButtons, setInprogressButtons] = useState({
    install: false,
    uninstall: false,
    start: false,
    stop: false,
    restart: false,
  });

  //create new db stat

  // console.log("breadcrumbs: ", breadcrumbs);

  const popup_data = reduxState('popup_data');
  // console.log("popup_data: ", popup_data);

  //handle loading
  useEffect(() => {
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 5000);
  }, []);

  //fetch databases
  const fetchPageData = async () => {

    const statusReqConfig = {
      url: "/api/v1",
      method: "POST",
      body: JSON.stringify({
        all: false,
        action: "GET",
        itsFor: "databases",
        itsForType: "services",
        itemKey: pageServiceName,
        itemId: null,
        parentKey: null,
        parentId: null
      })
    };


    const databasesReqConfig = {
      url: "/api/v1",
      method: "POST",
      body: JSON.stringify({
        all: true,
        action: "GET",
        itsForType: pageServiceType,
        itsFor: pageServiceName,
        itemKey: 'databases',
        itemId: null,
        parentKey: null,
        parentId: null
      })
    }

    const dbUsersReqConfig = {
      url: "/api/v1",
      method: "POST",
      body: JSON.stringify({
        all: true,
        action: "GET",
        itsForType: pageServiceType,
        itsFor: pageServiceName,
        itemKey: 'users',
        itemId: null,
        parentKey: null,
        parentId: null
      })
    }

    setIsLoading(true);
    const res = await excFetch(statusReqConfig);
    const isInstalled = res.data && res.data.length && res.data.installed;
    const isActive = res.data && res.data.length && res.data.active;
    const isOK = isInstalled && isActive;
    if (res.success && res.data) {
      setdatabaseDataLocal(res.data);
    }

    // if (!isOK) {
    //   setIsLoading(false);
    //   return;
    // }

    const res2 = await excFetch(databasesReqConfig);
    const res3 = await excFetch(dbUsersReqConfig);
    // console.log("res mysql status: ", res);
    // console.log("res mysql databases: ", res2);



    // if (res.success && res.data) {
    //   setdatabaseDataLocal(res.data);
    // }

    if (res2.success && res2.data && res2.data.length > 0) {
      const fd = [];
      res2.data.forEach((d) => {
        if (!dbExcludeList.includes(d.name)) {
          fd.push(d);
        }
      });
      setDatabases(fd);
    }

    if (res3.success && res3.data && res3.data.length > 0) {
      const fd = [];
      res3.data.forEach((d) => {
        if (!dbUserExcludeList.includes(d.name)) {
          fd.push(d);
        }
      });
      setDbUsers(fd);
    }


    setIsLoading(false);
  }
  useEffect(() => {
    fetchPageData();
  }, []);


  const bytesToMb = (bytes) => {
    //bytes to MB, bianry
    if (bytes) {
      let v = parseInt(bytes);
      v = v / 1024 / 1024;
      v = v.toFixed(2);
      v = v + ' MB';
      return v;
    }
    return '0';
  }



  const handleInstall = async (action, confirmed) => {
    // console.log("confirmed: ", confirmed, action);
    setPopupData(popupDataSample);
    // return;

    if (!confirmed) return;

    // return;


    const tAction = action === 'install' ? 'install' : 'uninstall';
    const d = {
      url: "/api/v1",
      method: "POST",
      body: JSON.stringify({
        all: false,
        action: "UPDATE",
        itsFor: pageServiceName,
        itsForType: pageServiceType,
        operation: tAction,
        itemKey: null,
        itemId: null,
        parentKey: null,
        parentId: null
      })
    }

    setIsLoading(true);
    const res = await excFetch(d);
    // console.log("res mysql install: ", res);
    if (res.success) {
      fetchPageData();
    }
    setIsLoading(false);
  };

  const handleUpdateDb = async (operation) => {
    const d = {
      url: "/api/v1",
      method: "POST",
      body: JSON.stringify({
        all: false,
        action: "UPDATE",
        itsFor: pageServiceName,
        itsForType: pageServiceType,
        itemKey: pageServiceName,
        operation: operation,
        itemId: null,
        parentKey: null,
        parentId: null
      })
    }

    setIsLoading(true);
    const res = await excFetch(d);
    if (res.success) {
      notify('success', res.message);
    } else {
      const m = 'Error restarting' + res.message;
      notify('error', m);
    }
    setIsLoading(false);

    fetchPageData();

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

  const handleCreateDb = async () => {
    // console.log("newDbData: ", newDbData);

    const isVaidObj = validateDbname(newDbData.name);
    if (!isVaidObj.status) {
      notify('error', isVaidObj.message);
      return;
    }


    if (!newDbData.name) {
      return;
    }

    if (newDbData.length < 1) {
      return;
    }

    const d = {
      url: "/api/v1",
      method: "POST",
      body: JSON.stringify({
        all: false,
        action: "CREATE",
        itsFor: pageServiceName,
        itsForType: "databases",
        itemKey: "database",
        itemId: null,
        parentKey: null,
        parentId: null,
        data: { name: newDbData.name }
      })
    }

    setIsLoadingNewDb(true);
    const res = await excFetch(d);
    console.log("res create db: ", res);
    if (res.success) {
      const newDatabases = [...databases];
      newDatabases.push({ name: newDbData.name, user: 'none' });
      notify('success', 'Database created successfully');
      setDatabases(newDatabases);
      setNewDbData({ name: '', password: '' });
    }
    setIsLoadingNewDb(false);

  }

  const handleDeleteDb = async (type, data) => {
    console.log("delete db: ", data);

    const d = {
      url: "/api/v1",
      method: "POST",
      body: JSON.stringify({
        all: false,
        action: "DELETE",
        itsFor: pageServiceName,
        itsForType: "databases",
        itemKey: "database",
        itemId: null,
        parentKey: null,
        parentId: null,
        data: { name: data.name }
      })

    }

    setIsLoading(true);
    const res = await excFetch(d);
    console.log("res delete db: ", res);
    if (res.success) {
      const newDatabases = [...databases];
      const index = newDatabases.findIndex((db) => db.name === data.name);
      if (index > -1) {
        newDatabases.splice(index, 1);
        setDatabases(newDatabases);
        notify('success', 'Database deleted successfully');
      }

    }
    setIsLoading(false);
  }

  const handleRemoveUserFromDB = async (type, data) => {
    console.log("delete user: ", data);

    const d = {
      url: "/api/v1",
      method: "POST",
      body: JSON.stringify({
        all: false,
        action: "UPDATE",
        itsFor: "mysql",
        itsForType: "databases",
        itemKey: "user",
        operation: "removeUserFromDb",
        itemId: data.user,
        parentKey: "database",
        parentId: data.name,
        data: { dbName: data.name, user: data.user }
      })

    }

    setIsLoading(true);
    const res = await excFetch(d);
    console.log("res delete user: ", res);
    if (res.success) {
      let newDatabases = [...databases];

      newDatabases.forEach((db) => {
        if (db.name === data.name) {
          db.user = 'none';
        }
      });
      setDatabases(newDatabases);
      notify('success', 'User deleted successfully');

    }

    setIsLoading(false);
  }


  const handleAddUserToDb = async () => {
    // console.log("newUserToDbData: ", newUserToDbData);

    if (!newUserToDbData.dbName || !newUserToDbData.user) {
      return;
    }

    const d = {
      url: "/api/v1",
      method: "POST",
      body: JSON.stringify({
        all: false,
        action: "UPDATE",
        itsFor: pageServiceName,
        itsForType: "databases",
        operation: "addUserToDb",
        itemKey: "user",
        itemId: null,
        parentKey: "database",
        parentId: newUserToDbData.dbName,
        data: { dbName: newUserToDbData.dbName, user: newUserToDbData.user }
      })

    }

    setIsLoadingAddUserToDb(true);
    const res = await excFetch(d);
    console.log("res add user to db: ", res);
    if (res.success) {
      let newDatabases = [...databases];
      newDatabases.forEach((db) => {
        if (db.name === newUserToDbData.dbName) {
          db.user = newUserToDbData.user;
        }
      });
      setIsLoadingAddUserToDb(false);
      // notify('success', 'User added to database successfully');

      if (pageServiceName === 'postgresql') {
        let dt = { ...postgreSqlAccessData }
        dt.connectionString = res.data.connectionString;
        dt.user = res.data.name;
        setPostgreSqlAccessData(dt);
      }

    }

    setIsLoading(false);
  }


  const handleCreateUser = async () => {
    // console.log("newUserToDbData: ", newDbUser);

    const isVaidObj = validateDbname(newDbUser.name);
    if (!isVaidObj.status) {
      notify('error', isVaidObj.message);
      return;
    }


    if (!newDbUser.name || !newDbUser.password) {
      return;
    }

    const d = {
      url: "/api/v1",
      method: "POST",
      body: JSON.stringify({
        all: false,
        action: "CREATE",
        itsFor: pageServiceName,
        itsForType: "databases",
        itemKey: "user",
        itemId: null,
        parentKey: null,
        parentId: null,
        data: { name: newDbUser.name, password: newDbUser.password }
      })
    }

    setIsLoadingNewUser(true);
    const res = await excFetch(d);
    // console.log("res create user: ", res);
    if (res.success) {
      const newDbUsers = [...dbUsers];
      newDbUsers.push({ name: newDbUser.name, privileges: '[all]' });
      notify('success', 'User created successfully');
      setDbUsers(newDbUsers);
      setNewDbUser({ name: '', password: '' });
    }
    setIsLoadingNewUser(false);


  };

  const handleDeleteUser = async (type, data) => {
    // console.log("delete user: ", data);

    const d = {
      url: "/api/v1",
      method: "POST",
      body: JSON.stringify({
        all: false,
        action: "DELETE",
        itsFor: pageServiceName,
        itsForType: "databases",
        itemKey: "user",
        itemId: null,
        parentKey: null,
        parentId: null,
        data: { name: data.name }
      })

    }

    setIsLoading(true);
    const res = await excFetch(d);
    // console.log("res delete user: ", res);
    if (res.success) {
      notify('success', 'User deleted successfully');
      let newDbUsers = [...dbUsers];
      newDbUsers = newDbUsers.filter((user) => user.name !== data.name);
      setDbUsers(newDbUsers);
    }

    setIsLoading(false);
  }

  const handleChangeDbUserPassword = async (data) => {
    console.log("change password: ", data);
    // return;

    if (!data.user || !data.password) {
      notify('error', 'Invalid data');
      return;
    }

    if (!data.user.length || !data.password.length) {
      notify('error', 'Invalid data');
      return;
    }

    const d = {
      url: "/api/v1",
      method: "POST",
      body: JSON.stringify({
        all: false,
        action: "UPDATE",
        itsFor: pageServiceName,
        itsForType: "databases",
        operation: "changeUserPassword",
        itemKey: "user",
        itemId: data.user,
        parentKey: null,
        parentId: null,
        data: { user: data.user, password: data.password }
      })
    };

    setIsLoading(true);
    const res = await excFetch(d);
    // console.log("res change password: ", res);
    if (res.success) {
      notify('success', 'Password changed successfully');
    }

    setIsLoading(false);

  }



  // console.log("databases: ", databases);

  return (
    <div className="container-xxl container-main">
      <div className="row">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            {
              breadcrumbs.map((crumb, index) => {
                return (
                  <li key={index} className={"breadcrumb-item" + (crumb.active ? " active" : "")}>
                    {
                      crumb.active ? crumb.name : <a href={crumb ? crumb.link : '/'}>{crumb.name}</a>
                    }
                  </li>
                )
              })
            }

            {/* <li className="breadcrumb-item"><a href="#">Home</a></li>
            <li className="breadcrumb-item active" aria-current="page">Library</li> */}
          </ol>
        </nav>
      </div>
      <div className="row">
        <h4>Databases</h4>
      </div>

      <div className="row mb-5">
        <div className="col-2 d-flex">
          <div className={"custom-card-2"}>
            <div className="cr2-logo">
              <img src="/images/other/postgresql.png" alt="" />
            </div>
            <div className="cr2-title">
              <span>PostgreSQL</span>
            </div>
            <div className={"cr2-status" + (isLoading ? " loading" : "")}>
              <span
                className={"status-cyrcle-" + (databaseDataLocal.active ? "success" : "info")}
              ></span>
              <span className="status-text">
                {databaseDataLocal.active ? "active" : "inactive"}
              </span>
            </div>
          </div>

        </div>
        <div className="col">
          <div className={"custom-card-3" + (isLoading ? ' loading' : '')}>
            <div className="row mb-3">
              <div className="d-flex">
                <span className="mr-1">
                  {'CPU '}
                  <strong>{(databaseDataLocal.cpu || '0')}</strong>
                  {'%'}
                </span>
                <span className="mr-1">
                  {'Memory(RAM) '}
                  <strong>{bytesToMb(databaseDataLocal.memory)}</strong>
                </span>
                <span className="mr-1">
                  {'Disk '}
                  <strong>{bytesToMb(databaseDataLocal.disk)}</strong>
                </span>
              </div>
            </div>
            <div className="row">
              <div className="col d-flex">
                <button
                  onClick={() => {
                    if (databaseDataLocal.active) {
                      handleUpdateDb('stop');

                    } else {
                      handleUpdateDb('start');
                    }
                  }}
                  className="btn btn-light mr-1"
                  disabled={!databaseDataLocal.installed}
                >
                  {
                    databaseDataLocal.active && databaseDataLocal.installed
                      ? <MdSquare className="action-icon" />
                      : <MdPlayArrow className="action-icon" />
                  }
                </button>
                <button
                  onClick={() => {
                    handleUpdateDb('restart');
                  }}
                  disabled={!databaseDataLocal.installed}
                  className="btn btn-light mr-1"
                >
                  <MdOutlineReplay className="action-icon" />
                </button>
                <button
                  onClick={() => {
                    const action = databaseDataLocal.active && databaseDataLocal.installed ? 'uninstall' : 'install';
                    handleConfirm(
                      `Uninstall ${pageServiceName}`,
                      `Are you sure you want to uninstall ${pageServiceName}?`,
                      action,
                      null,
                      (confirmed) => handleInstall(action, confirmed)
                    );
                  }}
                  className={"btn btn-light mr-1 d-flex align-items-center" + (inprogressButtons.install ? ' disabled' : '')}
                >
                  {
                    databaseDataLocal.installed
                      ? <div>Uninstall</div>
                      : <div>Install</div>

                  }
                  {
                    inprogressButtons.install &&
                    <div className="ml-03 spinner-grow spinner-grow-sm text-warning" role="status">
                    </div>
                  }
                </button>
              </div>
            </div>

            <div>

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
        </div>
      </div>
      {
        databaseDataLocal.installed && databaseDataLocal.active &&
        <div className="row">
          <div className="custom-card-3">
            <div className="row">
              <h6>Create Database</h6>
            </div>
            <div className="row">
              <div className="col ">
                <input type="text"
                  className="form-control mr-1"
                  placeholder="database name"
                  onChange={(e) => {
                    let changedNewDbData = { ...newDbData };
                    changedNewDbData.name = e.target.value;
                    setNewDbData(changedNewDbData);
                  }}
                />
              </div>
              {/* <div className="col ">
            <input type="text"
              className="form-control mr-1"
              placeholder="database password"
              onChange={(e) => {
                let changedNewDbData = { ...newDbData };
                changedNewDbData.password = e.target.value;
                setNewDbData(changedNewDbData);
              }}
            />
          </div> */}
              <div className="col">
                <button
                  disabled={isLoadingNewDb}
                  className="btn btn-primary"
                  onClick={() => {
                    console.log("create db");
                    handleCreateDb()
                  }}
                >
                  Create
                  {isLoadingNewDb &&
                    <div className="spinner-grow ml-03 spinner-grow-sm text-warning" role="status">
                    </div>
                  }
                </button>
              </div>
            </div>
          </div>
          <div className="custom-card-3">
            <div className="row">
              <h6>Create User</h6>
            </div>
            <div className="row">
              <div className="col ">
                <input
                  type="text"
                  value={newDbUser.name}
                  className="form-control mr-1"
                  placeholder="user name"
                  onChange={(e) => {
                    let changedNewUserToDbData = { ...newDbUser };
                    changedNewUserToDbData.name = e.target.value;
                    setNewDbUser(changedNewUserToDbData);
                  }}
                />
              </div>
              <div className="col ">
                <input
                  value={newDbUser.password}
                  type="text"
                  className="form-control mr-1"
                  placeholder="user password"
                  onChange={(e) => {
                    let changedNewUserToDbData = { ...newDbUser };
                    changedNewUserToDbData.password = e.target.value;
                    setNewDbUser(changedNewUserToDbData);
                  }}

                />
              </div>
              <div className="col">
                <button
                  disabled={isLoadingNewUser}
                  className="btn btn-primary"
                  onClick={() => {
                    handleCreateUser();
                  }}
                >
                  Create
                  {isLoadingNewUser &&
                    <div className="spinner-grow ml-03  spinner-grow-sm text-warning" role="status">
                    </div>
                  }
                </button>
              </div>
            </div>
          </div>
          <div className="custom-card-3">
            <div className="row">
              <h6>
                {
                  pageServiceName === 'postgresql'
                    ? 'Connect details'
                    : 'Add User To Database'
                }
              </h6>
            </div>
            <div className="row">
              <div className="col ">
                <Select
                  instanceId={"dbSelect"}
                  placeholder="Select database"
                  value={newUserToDbData.dbName ? { value: newUserToDbData.dbName, label: newUserToDbData.dbName } : null}
                  options={databases.map((db) => {
                    return { value: db.name, label: db.name }
                  })}
                  onChange={(selectedOption) => {
                    console.log("selectedOption: ", selectedOption);
                    let changedNewUserToDbData = { ...newUserToDbData };
                    changedNewUserToDbData.dbName = selectedOption.value;
                    setNewUserToDbData(changedNewUserToDbData);
                  }}
                />
              </div>
              <div className="col ">
                <Select
                  instanceId={"userSelect"}
                  placeholder="Select user"
                  value={newUserToDbData.user ? { value: newUserToDbData.user, label: newUserToDbData.user } : null}
                  options={dbUsers.map((user) => {
                    return { value: user.name, label: user.name }
                  })}
                  onChange={(selectedOption) => {
                    let changedNewUserToDbData = { ...newUserToDbData };
                    changedNewUserToDbData.user = selectedOption.value;
                    setNewUserToDbData(changedNewUserToDbData);
                  }}
                />
              </div>
              <div className="col">
                <button
                  disabled={isLoadingAddUserToDb}
                  className="btn btn-primary"
                  onClick={() => {
                    handleAddUserToDb()
                  }}
                >
                  {
                    pageServiceName === 'postgresql'
                      ? 'Get'
                      : 'Add'
                  }
                  {isLoadingAddUserToDb &&
                    <div className="spinner-grow ml-03 spinner-grow-sm text-warning" role="status">
                    </div>
                  }
                </button>
              </div>
            </div>
            <div className="row mt-3">
              {postgreSqlAccessData.connectionString &&
                <div className="col">
                  <span>Access link</span>
                  <CopyInput value={postgreSqlAccessData.connectionString} />
                </div>
              }
            </div>
          </div>
          <div className="row mt-5">
            <h4>Databases</h4>
          </div>
          <div className="row">
            <SimpleTable
              itsFor="databases"
              data={databases}
              buttons={{
                edit: false,
                delete: true,
                addNew: false,
                changePassword: false,
                removeUser: true,
                deleteCallback: (data) => {
                  // console.log("delete db", data);
                  handleConfirm(
                    'Delete Database',
                    'Are you sure you want to delete this database?',
                    'delete',
                    data,
                    handleDeleteDb
                  );
                },
                removeUserCallback: (data) => {
                  console.log("delete user", data);
                  handleConfirm(
                    'Delete User',
                    'Are you sure you want to delete this user?',
                    'delete',
                    data,
                    handleRemoveUserFromDB
                  );
                }
              }}
            />

          </div>
          <div className="row mt-5">
            <h4>Database Users</h4>
          </div>
          <div className="row">
            <SimpleTable
              itsFor="users"
              data={dbUsers}
              buttons={{
                edit: false,
                delete: true,
                addNew: false,
                changePassword: false,
                deleteUser: false,
                deleteCallback: (data) => {
                  // console.log("delete db", data);
                  handleConfirm(
                    'Delete User',
                    'Are you sure you want to delete this user?',
                    'delete',
                    data,
                    handleDeleteUser
                  );
                },

                // changePasswordCallback: (data) => {
                //   // console.log("changePasswordCallback", data);
                //   handleChangeDbUserPassword(data);
                // }
              }}
            />

          </div>
        </div>
      }

    </div>

  );
}
