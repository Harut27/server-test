'use client';
import Image from "next/image";
import { usePathname } from "next/navigation";
import { excFetch } from "../services/client/fetchClient";
import { MdFolder } from "react-icons/md";

import { useState, useEffect } from "react";
import Link from "next/link";

let systemInfoSample = {
  ip: "",
  cpu: {
    total: 100,
    used: 0,
  },
  memory: {
    total: 0,
    used: 0,
  },
  disk: {
    total: 0,
    used: 0,
  }
}


export default function Home() {

  const [isLoading, setIsLoading] = useState(true);
  const [systemInfo, setSystemInfo] = useState(systemInfoSample);
  const [databases, setDatabases] = useState([]);
  const [mysql, setMysql] = useState({ active: false, installed: false });
  const [postgresql, setPostgresql] = useState({ active: false, installed: false });
  const [mongodb, setMongodb] = useState({ active: false, installed: false });
  const path = usePathname();


  useEffect(() => {
    setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 5000);
  }, []);

  //fetch databases, system info
  useEffect(() => {
    const fetchData = async () => {

      const systemInfoReqConfig = {
        url: "/api/v1",
        method: "POST",
        body: JSON.stringify({
          all: false,
          action: "GET",
          itsFor: "systemInfo",
          itsForType: "services",
          itemKey: null,
          itemId: null,
          parentKey: null,
          parentId: null
        })
      }

      const d = {
        url: "/api/v1",
        method: "POST",
        body: JSON.stringify({
          all: true,
          action: "GET",
          itsFor: "databases",
          itsForType: "services",
          itemKey: null,
          itemId: null,
          parentKey: null,
          parentId: null
        })
      }

      setIsLoading(true);
      const systemInfoRes = await excFetch(systemInfoReqConfig);
      const res = await excFetch(d);


      console.log("systemInfoRes: ", systemInfoRes);
      if (systemInfoRes.success && systemInfoRes.data) {
        setSystemInfo(systemInfoRes.data);
      }
      // console.log("res: ", res);
      if (res.success) {
        setDatabases(res.data);
      }
      setIsLoading(false);


      //set interval to get system info every 7 seconds
      // setInterval(async () => {
      //   const systemInfoRes = await excFetch(systemInfoReqConfig);
      //   if (systemInfoRes.success && systemInfoRes.data) {
      //     setSystemInfo(systemInfoRes.data);
      //   }
      // }, 7000);
    }

    fetchData();
  }, []);




  //set each database data
  useEffect(() => {
    // console.log("databases: ", databases);
    if (databases && databases.length > 0) {
      databases.forEach((db) => {
        if (db.mysql) {
          setMysql(db.mysql);
        }
        if (db.postgresql) {
          setPostgresql(db.postgresql);
        }
        if (db.mongodb) {
          setMongodb(db.mongodb);
        }
      });
    }
  }, [databases]);


  const getSystemInfo = () => {
    let newData = JSON.parse(JSON.stringify(systemInfo));

    newData.cpu.usedPercent = newData.cpu.used + "%";


    newData.disk.total = parseFloat(newData.disk.total) / 1024 / 1024 / 1024;
    newData.disk.used = parseFloat(newData.disk.used) / 1024 / 1024 / 1024;
    newData.disk.usedPercent = (newData.disk.used / newData.disk.total) * 100;
    newData.disk.usedPercent = newData.disk.usedPercent.toFixed(0) + "%";
    newData.disk.used = Number(newData.disk.used.toFixed(0)).toLocaleString() + " GB";
    newData.disk.total = Number(newData.disk.total.toFixed(0)).toLocaleString() + " GB";


    newData.memory.total = parseFloat(newData.memory.total) / 1024 / 1024;
    newData.memory.used = parseFloat(newData.memory.used) / 1024 / 1024;
    newData.memory.usedPercent = (newData.memory.used / newData.memory.total) * 100;
    newData.memory.usedPercent = newData.memory.usedPercent.toFixed(0) + "%";
    newData.memory.used = Number(newData.memory.used.toFixed(0)).toLocaleString() + " MB";
    newData.memory.total = Number(newData.memory.total.toFixed(0)).toLocaleString() + " MB";


    // console.log("newData: ", newData);
    return newData;

  };

  return (
    <div className="container-xxl container-main">
      <div className="row">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              Home
            </li>
          </ol>
        </nav>
      </div>


      <div className="row">
        <div className="col">
          <div className="row ">
            <h4>Projects</h4>
          </div>
          <div className="row">
            <div className="col d-flex">
              <Link href="/projects" className="no-style-link" >
                <div className={"custom-card-2"}>
                  <div className="cr2-logo">
                    <img src="/images/other/www.svg" alt="" />
                  </div>
                  <div className="cr2-title">
                    <span>Projects</span>
                  </div>
                  <div className={"cr2-status" + (isLoading ? " loading" : "")}>
                    {/* <span
                    className={"status-cyrcle-success"}
                  ></span>
                  <span className="status-text">
                    {"active"}
                  </span> */}
                  </div>
                </div>
              </Link>
              <Link href="/file-manager" className="no-style-link" >
                <div className={"custom-card-2"}>
                  <div className="cr2-logo">
                    <MdFolder style={{width:'40px', height:'40px'}}/>
                  </div>
                  <div className="cr2-title">
                    <span>File Manager</span>
                  </div>
                  <div className={"cr2-status" + (isLoading ? " loading" : "")}>
                    {/* <span
                    className={"status-cyrcle-success"}
                  ></span>
                  <span className="status-text">
                    {"active"}
                  </span> */}
                  </div>
                </div>
              </Link>


            </div>
          </div>
          <div className="row mt-5">
            <h4>Databases</h4>
          </div>
          <div className="row">
            <div className="col d-flex">
              <Link href="/databases/mysql" className="no-style-link" >
                <div className={"custom-card-2"} >
                  <div className="cr2-logo">
                    <img src="/images/other/mysql.png" alt="" />
                  </div>
                  <div className="cr2-title">
                    <span>MySQL</span>
                  </div>
                  <div className={"cr2-status" + (isLoading ? " loading" : "")}>
                    <span
                      className={"status-cyrcle-" + (mysql.active ? "success" : "info")}
                    ></span>
                    <span className="status-text">
                      {mysql.active ? "active" : "inactive"}
                    </span>
                  </div>
                </div>
              </Link>

              <Link href="/databases/postgresql" className="no-style-link" >
                <div className={"custom-card-2"}>
                  <div className="cr2-logo">
                    <img src="/images/other/postgresql.png" alt="" />
                  </div>
                  <div className="cr2-title">
                    <span>PostgreSQL</span>
                  </div>
                  <div className={"cr2-status" + (isLoading ? " loading" : "")}>
                    <span
                      className={"status-cyrcle-" + (postgresql.active ? "success" : "info")}
                    ></span>
                    <span className="status-text">
                      {postgresql.active ? "active" : "inactive"}
                    </span>
                  </div>
                </div>
              </Link>
              <div className={"custom-card-2 disabled"}>
                <div className="cr2-logo">
                  <img src="/images/other/mongodb.svg" alt="" />
                </div>
                <div className="cr2-title">
                  <span>MongoDB</span>
                </div>
                <div className={"cr2-status" + (isLoading ? " loading" : "")}>
                  <span
                    className={"status-cyrcle-" + (mongodb.active ? "success" : "info")}
                  ></span>
                  <span className="status-text">
                    {mongodb.active ? "active" : "inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-3">
          <div className={"system-info" + (isLoading ? ' loading' : '')}>
            <div className="system-info-item">
              <span>IP</span>
              <input
                disabled={true}
                type="text"
                className="form-control"
                value={systemInfo.ip}
              />
            </div>
            <div className={"system-info-item" + (isLoading ? ' loading' : '')}>
              <span>CPU</span>
              <div className="progress" role="progressbar" aria-label="Example with label" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                <div className="progress-bar" style={{ "width": getSystemInfo().cpu.usedPercent }}>{getSystemInfo().cpu.usedPercent}</div>
              </div>
              <span>{getSystemInfo().cpu.used + '/' + getSystemInfo().cpu.total}</span>
            </div>
            <div className={"system-info-item" + (isLoading ? ' loading' : '')}>
              <span>Memory(RAM)</span>
              <div className="progress" role="progressbar" aria-label="Example with label" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                <div className="progress-bar" style={{ "width": getSystemInfo().memory.usedPercent }}>{getSystemInfo().memory.usedPercent}</div>
              </div>
              <span>{getSystemInfo().memory.used + '/' + getSystemInfo().memory.total}</span>
            </div>
            <div className={"system-info-item" + (isLoading ? ' loading' : '')}>
              <span>Disk</span>
              <div className="progress" role="progressbar" aria-label="Example with label" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                <div className="progress-bar" style={{ "width": getSystemInfo().disk.usedPercent }}>{getSystemInfo().disk.usedPercent}</div>
              </div>
              <span>{getSystemInfo().disk.used + '/' + getSystemInfo().disk.total}</span>
            </div>
          </div>
        </div>
      </div>


      <div className="row mt-5">
        <h4>Web Server</h4>
      </div>
      <div className="row">
        <div className="col d-flex">
          <div className={"custom-card-2 disabled"}>
            <div className="cr2-logo">
              <img src="/images/other/nginx-logo.svg" alt="" />
            </div>
            <div className="cr2-title">
              <span>Nginx</span>
            </div>
            <div className={"cr2-status" + (isLoading ? " loading" : "")}>
              <span
                className={"status-cyrcle-success"}
              ></span>
              <span className="status-text">
                {"active"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-5">
        <h4>SSL</h4>
      </div>
      <div className="row">
        <div className="col d-flex">
          <div className={"custom-card-2 disabled"}>
            <div className="cr2-logo">
              <img src="/images/other/letsencrypt_icon.svg" alt="" />
            </div>
            <div className="cr2-title">
              <span>CertBot</span>
            </div>
            <div className={"cr2-status" + (isLoading ? " loading" : "")}>
              <span
                className={"status-cyrcle-success"}
              ></span>
              <span className="status-text">
                {"active"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
