'use client'
import { useState, useEffect } from "react";
import { MdContentCopy, MdCheck } from "react-icons/md";

export default function CopyInput({ value }) {
    const [copied, setCopied] = useState(false);
    const [isSecureConnection, setIsSecureConnection] = useState(false);

    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => {
                setCopied(false);
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [copied]);

    useEffect(() => {
        const isWin = typeof window !== "undefined";
        const isSec = isWin ? window.isSecureContext : false;

        if (isSec) {
            setIsSecureConnection(isSec);
        }
    }, []);


    async function hadnleCopy() {

        try {
            if (isSecureConnection) {
                navigator.clipboard.writeText(value);
                setCopied(true);
            } else {
                // document.execCommand(value);
                // console.log("document", value);
                // document.copyText(value);
            }
        } catch (err) {
            // console.log("error", err);
        }


    }

    const style = {
        maxWidth: isSecureConnection ? "400px" : "100%"
    }

    return (
        <div className="input-group" style={style}>
            <input
                disabled={true}
                type="text"
                className="form-control"
                value={value}
                readOnly
            />
            {
                isSecureConnection &&
                <div className="input-group-append">
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => {
                            hadnleCopy()
                        }}
                    >
                        {copied ?
                            <MdCheck />
                            :
                            <MdContentCopy />
                        }
                    </button>
                </div>
            }

        </div>
    );
}