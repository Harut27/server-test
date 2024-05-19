'use client';
import { useState, useEffect, useRef } from "react";
import "./style.scss";
import { MdEdit, MdDelete, MdSave, MdClose, MdSettings } from "react-icons/md";
import Link from "next/link";

const dbExcludeList = ['information_schema', 'mysql', 'performance_schema', 'sys'];
const dbUserExcludeList = ['root', 'mysql.sys', 'mysql.session', 'mysql', 'debian-sys-maint', 'mysql.infoschema'];



export const SimpleTable = (props) => {
    const { itsFor, data, buttons } = props;
    const [tableData, setTableData] = useState(data || []);

    const [inLineInputActive, setInLineInputActive] = useState(false);
    const [editingUser, setEditingUser] = useState({ name: "", password: "" });

    useEffect(() => {
        if (data && data.length > 0) {
            setTableData(data);
        }
    }, [data]);

    const headers = tableData.length > 0 ? Object.keys(tableData[0]) : [];
    if (headers.length > 0) {
        headers.unshift("#");
        headers.push("Actions");
    }

    // console.log("headers: ", headers);


    const isDisabledTr = (row) => {
        let className = "";
        let isDisabled = false;
        if (dbExcludeList.includes(row.name) || dbUserExcludeList.includes(row.name)) {
            isDisabled = true;
        }


        if (isDisabled) {
            className = "disabled-tr";
        }
        return className;
    }

    // console.log("tableData: ", tableData);
    return (
        <div className="custom-table-1-container">
            {headers.length === 0 &&
                <div className="d-flex mt-3 justify-content-center align-items-center">
                    <h4>No Data</h4>
                </div>
            }
            <table className="custom-table-1">
                <thead>
                    <tr>
                        {headers.map((header, index) => {
                            return <th key={index}>{header}</th>
                        })}
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((row, index) => {
                        return (
                            <tr key={index} className={isDisabledTr(row)}>
                                {headers.map((header, index2) => {
                                    if (header === "#") {
                                        return <td key={index2}>
                                            <div style={{ minWidth: '20px' }}>{index + 1}</div>
                                        </td>
                                    }
                                    if (header === "Actions") {
                                        return (
                                            <td key={index2}>
                                                <div className="d-flex" >
                                                    {buttons?.changePassword &&
                                                        <div className="d-flex" style={{ width: '250px' }}>
                                                            {!inLineInputActive && editingUser.name !== row.name &&

                                                                <div style={{ width: '250px' }}>
                                                                    <a
                                                                        className="btn btn-sm btn-link"
                                                                        onClick={() => {
                                                                            setInLineInputActive(true);
                                                                            setEditingUser({ ...editingUser, name: row.name });
                                                                        }}
                                                                    >
                                                                        Change password
                                                                    </a>
                                                                </div>
                                                            }
                                                            {
                                                                inLineInputActive && editingUser.name === row.name &&
                                                                <div className="d-flex" style={{ width: '250px' }}>
                                                                    <input
                                                                        type="text"
                                                                        style={{ maxHeight: "30px" }}
                                                                        placeholder="New password"
                                                                        className="form-control mr-1"
                                                                        value={editingUser.password}
                                                                        onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            if (buttons.changePasswordCallback) {
                                                                                buttons.changePasswordCallback({
                                                                                    user: editingUser.name,
                                                                                    password: editingUser.password
                                                                                });
                                                                            }
                                                                            setInLineInputActive(false);
                                                                            setEditingUser({ name: '', password: '' });
                                                                        }}
                                                                        className="btn btn-sm btn-primary" style={{ marginRight: '3px' }}>
                                                                        <MdSave />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setInLineInputActive(false);
                                                                            setEditingUser({ name: '', password: '' });
                                                                        }}
                                                                        className="btn mr-1 btn-sm btn-primary">
                                                                        <MdClose />
                                                                    </button>

                                                                </div>
                                                            }
                                                        </div>
                                                    }
                                                    {buttons?.removeUser &&
                                                        <button
                                                            onClick={
                                                                () => {
                                                                    if (buttons.removeUserCallback) {
                                                                        buttons.removeUserCallback(row);
                                                                    }
                                                                }
                                                            }
                                                            className="btn mr-1 btn-sm btn-primary">
                                                            remove user
                                                        </button>
                                                    }
                                                    {buttons.edit &&
                                                        <button className="btn mr-1 btn-sm btn-primary">
                                                            <MdEdit />
                                                        </button>
                                                    }
                                                    {buttons.delete &&
                                                        <button
                                                            onClick={
                                                                () => {
                                                                    if (buttons.deleteCallback) {
                                                                        buttons.deleteCallback(row);
                                                                    }
                                                                }
                                                            }
                                                            className="btn mr-1 btn-sm btn-danger"
                                                        >
                                                            <MdDelete />
                                                        </button>
                                                    }
                                                    {
                                                        buttons.projectDetails &&
                                                        <Link href={`/projects/${row.name}`}>
                                                            <button
                                                                onClick={() => { }}
                                                                type="button"
                                                                className={"btn btn-sm btn-primary"}
                                                            >
                                                                <MdSettings />
                                                            </button>
                                                        </Link>

                                                    }
                                                </div>
                                            </td>
                                        )
                                    }
                                    return <td key={index2}>
                                        <div >{row[header]}</div>
                                    </td>
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
};

