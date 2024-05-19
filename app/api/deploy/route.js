import { NextResponse } from "next/server";
import { deployProject, checkProjectStatus } from './deployProject';
import { getProccessJson, getProccesNameFromUrl } from './proccess';


export async function GET(req) {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    };


    const reqUrl = req.url;
    const proccessName = getProccesNameFromUrl(reqUrl);

    if (proccessName) {
        const proccessJsonRes = await getProccessJson(proccessName);
        if (proccessJsonRes.success) {
            resObj = proccessJsonRes;
        }
    }else{
        const res = await checkProjectStatus(req);
        return NextResponse.json(res);
    }

    if (resObj.success) {
        return NextResponse.json(resObj);
    } else {
        return NextResponse.json(resObj, { status: 500 });
    }
};

export async function POST(req) {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }
    // console.log("POST request body: ", req.body);
    const verifiedRequest = true;




    try {
        if (verifiedRequest) {
            const r = await deployProject(req);
            resObj = r;
        }
    } catch (err) {
        console.error(err)
    }


    //send response 
    if (resObj.success) {
        return NextResponse.json(resObj);
    } else {
        return NextResponse.json(resObj, { status: 500 })
    }
};

