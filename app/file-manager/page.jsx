'use client'
import { notify } from "../../util/notify/notifyMain";
import Breadcrumb from "../../components/breadcrumb/breadcrumb";
import { excFetch } from "../../services/client/fetchClient";
import { useEffect, useState } from "react";
import FileManager from "../../components/fileManager/fileManager";


export default function Home() {

    const [currentPath, setCurrentPath] = useState('/var/www');


    return (
        <div className="container-xxl container-main">
            <div className="row">
                <Breadcrumb />
            </div>
            <div>
                <FileManager
                    intialPath={currentPath}
                />
            </div>
        </div>
    )
};