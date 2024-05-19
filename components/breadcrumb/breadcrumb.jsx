'use client'
import { getBreadcrumbFromPath } from "../../util/breadcrumb/breadcrumb";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";


export default function Breadcrumb() {

    const path = usePathname();
    const breadcrumbs = getBreadcrumbFromPath(path);
    // console.log("breadcrumbs: ", breadcrumbs);

    function correctName(name) {
        let newName = name;
        if (newName.includes("-")) {
            newName = newName.split("-").join(" ");
        }

        return newName;
    }

    return (
        <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
                {
                    breadcrumbs.map((crumb, index) => {
                        return (
                            <li key={index} className={"breadcrumb-item" + (crumb.active ? " active" : "")}>
                                {
                                    crumb.active
                                        ? correctName(crumb.name)
                                        : <Link href={crumb ? crumb.link : '/'}>{correctName(crumb.name)}</Link>
                                }
                            </li>
                        )
                    })
                }
            </ol>
        </nav>
    )
}