import { NextResponse } from "next/server";
import {
    getOperations, installOperations, createOperations,
    deleteOperations, updateOperations
} from "../../../services/server/fetchOperations";
const requestIp = require('request-ip');


const verifyRequest = async (req) => {
    //get barear token from headers
    const authorization = req.headers.get("authorization");

    if (!authorization) {
        return false;
    }

    const token = authorization.split(" ")[1];
    if (!token) {
        return false;
    }

    //verify token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return false;
    }

    //check if token is valid
    if (!decodedToken) {
        return false;
    }

    return decodedToken;
};



export async function GET(req) {
    const body = req.body;
    console.log("GET request body: ", body);
    return NextResponse.json({ message: "Hello from the GET route!" });
};

export async function POST(req) {
    let resObj = {
        success: false,
        message: "Forbidden",
        data: []
    }
    // console.log("POST request body: ", req.body);
    // const ip = req.headers.get('x-forwarded-for');
    // console.log("ip: ", ip);

    const verifiedRequest = true;

    // //verify request/token, if not valid return 403
    // const verifiedRequest = await verifyRequest(req);
    // const verifiedRequest = await verifyRequest(req);
    // if (!verifiedRequest) {
    //     return NextResponse.json(resObj, { status: 403 })
    // }

    const reqBody = await req.json()
    // const oprData = { ...reqBody, ...verifiedRequest }
    const oprData = { ...reqBody }
    // execute appropriate function based on request body
    if (reqBody && reqBody.action === "GET") {
        const result = await getOperations(oprData)
        resObj = result;
    }
    if (reqBody && reqBody.action === "INSTALL") {
        const result = await installOperations(oprData)
        resObj = result;
    }
    if (reqBody && reqBody.action === "CREATE") {
        const result = await createOperations(oprData)
        resObj = result;
        // resObj = { success: true, message: "CREATE request received", data: {}};
    }
    if (reqBody && reqBody.action === "DELETE") {
        const result = await deleteOperations(oprData)
        resObj = result;
    }
    if (reqBody && reqBody.action === "UPDATE") {
        const result = await updateOperations(oprData)
        resObj = result;
    }

    //send response 
    if (resObj.success) {
        return NextResponse.json(resObj);
    } else {
        return NextResponse.json(resObj, { status: 400 })
    }
};