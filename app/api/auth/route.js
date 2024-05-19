import { NextResponse } from "next/server";
const fs = require('fs')

export async function POST(req) {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }
    const verifiedRequest = true;

    const reqBody = await req.json();
    try {
        if (verifiedRequest) {
            const accountJsonRes = getAccountJson();
            if (!accountJsonRes.success) {
                resObj.success = false;
                resObj.message = accountJsonRes.message
                return NextResponse.json(resObj, { status: 404 })
            }
            const validAccessToken = accountJsonRes.data.accessToken;
            const reqAccessToken = reqBody.accessToken ? reqBody.accessToken.trim() : '';
            const isAccessTokenValid = validAccessToken === reqAccessToken;

            // console.log('validAccessToken', validAccessToken)
            // console.log('reqAccessToken', reqAccessToken)

            if (isAccessTokenValid) {
                const accessTokens = accountJsonRes.data.accessToken;
                resObj.success = true;
                resObj.message = 'success';
                resObj.data = { accessToken: accessTokens }
                return NextResponse.json(resObj);
            }

            // const r = await deployProject(req);
            // resObj = r;
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


function getAccountJson() {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }

    const filePath = '/var/www/reactPanel/reactPanelStore/main.json'

    try {
        //check if file exists
        if (!fs.existsSync(filePath)) {
            resObj.message = 'account token not found'
            return resObj
        }
        const data = fs.readFileSync(filePath, 'utf8')

        resObj.success = true
        resObj.message = 'success'
        resObj.data = JSON.parse(data)
    } catch (err) {
        console.error(err)
    }

    return resObj
}