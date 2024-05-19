'use client';
import { MdOutlineRemoveRedEye, MdFileCopy } from 'react-icons/md';
// import { UploadImage } from "@/components/upload/uploadImage";

export const BeautifyComponent = (props) => {
    const { tagType, str, strHeader } = props;

    let newStr = str;
    let isDate = strHeader.includes('Date') || strHeader.includes('createdAt') || strHeader.includes('updatedAt');

    if (isDate) {
        //output format: Mon Jan 01 2000
        newStr = new Date(newStr).toDateString();

        //output format: Jan 01 2000
        newStr = newStr.slice(4);

    }

    if (tagType === 'input') {
        return (
            <input type="text" readOnly disabled className="form-control bg-grey no-focus" value={newStr} onChange={() => { }} />
        );
    } else if (tagType === 'textarea') {
        return (
            <textarea value={newStr} readOnly />
        );
    }

    else {

        // if (strHeader === 'logo') {
        //     return (
        //         <div >

        //         </div>
        //     );
        // } else {

        // }
        // console.log('newStr', newStr)
        const isLong = newStr.length > 18;
        return (
            <div
                style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', width: '100%', height: '100%' }}
            >
                {
                    isLong ?
                        <div className="" title={newStr}>
                            <MdOutlineRemoveRedEye
                                style={{ cursor: 'pointer', marginRight: '5px', marginBottom: '5px' }}
                                // onClick={() => {
                                //     //show full string, on tooltip
                                //     alert(newStr)
                                // }}
                            />
                            <MdFileCopy
                                style={{ cursor: 'pointer', marginRight: '5px', marginBottom: '5px' }}
                                onClick={() => {
                                    navigator.clipboard.writeText(newStr)
                                }}
                            />

                            {'...' + newStr.slice(-10)}
                            {/* {newStr} */}
                        </div>
                        : newStr
                }


            </div>
        );

    }



};