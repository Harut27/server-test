'use client';
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from 'next/navigation';
import "./navStyle.scss";
import { MdLogout } from "react-icons/md";
import { deleteCookie } from "../../util/cookies/main";
import Link from "next/link";

export default function TopNavbar(props) {
    const { sticky } = props;
    const _p = usePathname();

    const navbarClassName = "custom-navbar"
    const navItemClassName = "custom-navbar-link"
    const clientWindow = typeof window !== 'undefined' ? window : null;
    const pathName = clientWindow ? clientWindow.location.pathname : null;

    const containerClassPrefix = _p.includes('/app/') ? "container-fluid" : "container-xxl"
    const containerClassSuffix = " d-flex animate-easy-all"

    const [activeClassNames, setActiveClassNames] = useState({});
    const [containerClassName, setContainerClassName] = useState(containerClassPrefix + containerClassSuffix);


    useEffect(() => {
        const body = () => {
            if (!clientWindow) return;
            const path = clientWindow.location.pathname;
            let newActiveClassNames = { ...activeClassNames };
            newActiveClassNames[path] = 'active';
            setActiveClassNames(newActiveClassNames);
        };
        body();
    }, [clientWindow]);

    //make navbar sticky on scroll
    useEffect(() => {
        if (!clientWindow || !sticky) return;
        const navbar = clientWindow.document.querySelector(`.${navbarClassName}`);
        const scrollCallBack = () => {
            const scrollYHeight = clientWindow.scrollY;
            if (scrollYHeight > 55) {
                navbar.classList.add("sticky");
            } else {
                navbar.classList.remove("sticky");
            }
        };
        clientWindow.addEventListener("scroll", scrollCallBack);
        return () => {
            clientWindow.removeEventListener("scroll", scrollCallBack);
        };
    }, []);


    useEffect(() => {
        const isAppDirectory = pathName.includes("/app/");
        if (isAppDirectory) {
            setContainerClassName("container-fluid" + containerClassSuffix);
        }

    }, [pathName])


    return (
        <>
            <div className={navbarClassName}>
                <div className={containerClassName}>
                    <div className="nav-brand-section">
                        <div className="nav-log">
                            <Link href="/">
                                <Image src="/images/logo/rectangle_white_bg.svg" alt="logo" width="40" height="40" />
                            </Link>
                        </div>
                        <div className="nav-title"></div>
                    </div>
                    <div className="nav-links-section">
                        {/* <div className={navItemClassName}>
                            <Link href="/" className={activeClassNames["/"] || ''}>Home </Link>
                        </div> */}
                        {/* <div className={navItemClassName}>
                            <a href="/test" className={activeClassNames["/test"] || ''}>Test</a>
                        </div> */}
                        {/* <div className={navItemClassName}>
                            <a href="/app/home" className={activeClassNames["/app/home"] || ''}>app/home</a>
                        </div> */}
                    </div>
                    <div>
                        <button
                            className="btn btn-light"
                            onClick={() => {
                                const res = deleteCookie('_session');
                                if (res.success) {
                                    window.location.href = '/';
                                }
                            }}
                        >
                            <MdLogout />
                        </button>

                    </div>
                </div>
            </div>
        </>
    );
};