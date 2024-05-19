
import { jwtVerify } from "jose"
// const fs = require('fs');

const sessionCookieName = "_session";
const requiresAuthDirs = ["/", "/app"];
const validUrlsExcRegex = [/\/_next\/static/, /\.svg$/, /\.png$/, /\.css$/, /\.jpg$/, /\.jpeg$/, /\.gif$/, /\.ico$/, /\.woff$/, /\.woff2$/, /\.ttf$/, /\.eot$/, /\.[a-z0-9]+$/i];
const excludePaths = ["/api", "/auth", "/api/v1/auth", "/api/deploy"];
const excludePathsForRedirect = ["/auth/signin", "/auth/signup", "/api", "/auth", "/api/auth"];

const urlFilterStrs = ['/_next/static/chunks/app']
const isClearSearchParamsOnCheck = true;

const toCheck = (hostName, reqUrl, pathName) => {
    let isAuthRequired = false;
    let isAuthDir = false;

    //check if its auth required directory
    requiresAuthDirs.forEach((dir) => {
        if (pathName.startsWith(dir) || pathName === dir) {
            if (!isAuthDir) {
                isAuthDir = true;
            }
        }
    });

    if (!isAuthDir) {
        isAuthRequired = false;
        return isAuthRequired;
    } else {
        isAuthRequired = true;
    }

    //check if the path ecxludes auth
    excludePaths.forEach((excludePath) => {
        if (pathName === excludePath) {
            isAuthRequired = false;
        }
    });

    return isAuthRequired;
};


export const checkAuth = async (req, res, next) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        isAuthorized: false,
        isRedirect: false,
        data: []
    };

    let isAuthorized = false;
    let isValidAppUrl = false;
    const hostName = req.headers.get("host");
    const pathName = req.nextUrl.pathname
    const reqUrl = req.url;


    //exclude static files, so ponly actual page requests are checked
    const isVa = !validUrlsExcRegex.some((regex) => regex.test(pathName));
    // console.log("isVa: ", isVa);

    if (isVa) {
        isValidAppUrl = true;
    } else {
        isValidAppUrl = false;
    }

    if (!isValidAppUrl) return {
        success: true,
        isAuthorized: true,
        isRedirect: false
    }
    const requiresAuth = toCheck(hostName, reqUrl, pathName);
    // console.log("requiresAuth: ", requiresAuth, pathName);
    if (!requiresAuth) return {
        success: true,
        isAuthorized: true,
        isRedirect: false
    }




    // console.log("sessionCookie:=====> ", sessionCookie);
    // console.log("process.env.JWT_SECRET:=====> ", process.env.JWT_SECRET);


    // JWT email/pass based auth
    // try {
    //     const verifyResult = await jwtVerify(
    //         accessToken,
    //         new TextEncoder().encode(process.env.JWT_SECRET),
    //     );
    //     // console.log("verifyResult:=====> ", verifyResult);
    //     if (verifyResult) {
    //         // console.log("verifyResult.payload:=====> ", verifyResult.payload);

    //         let isExpired = false;
    //         const currentDate = new Date();
    //         const expDate = new Date(verifyResult.payload.exp * 1000);
    //         if (expDate < currentDate) {
    //             isExpired = true;
    //         }
    //         isAuthorized = isExpired ? false : true;

    //         return isAuthorized;
    //     } else {
    //         return false;
    //     }
    // } catch (error) {
    //     console.log("error: ", error);
    //     //delete the cookie
    //     return false;
    // }


    // accessToken based auth

    const isEcludeRedirect = excludePathsForRedirect.some((path) => path === pathName);
    try {


        let sessionCookie = null;
        const cookies = [];
        const requestHeaders = req.headers
        requestHeaders.forEach((value, key) => {
            if (key === "cookie") {
                const split = value.split(";");
                split.forEach((cookie) => {
                    const trimmedCookie = cookie.trim();
                    if (trimmedCookie.startsWith(`${sessionCookieName}=`)) {
                        const sessionCookieValue = trimmedCookie.substring(`${sessionCookieName}=`.length);
                        try {
                            const parsed = JSON.parse(decodeURIComponent(sessionCookieValue));
                            const theCookie = sessionCookieValue;
                            // console.log("cookie: ", parsed);

                            sessionCookie = parsed;
                        } catch (error) {
                            console.error('Error parsing session cookie:', error);
                        }
                    }
                });
            }
        });

        if (!sessionCookie) return {
            success: false,
            isAuthorized: false,
            isRedirect: isEcludeRedirect ? false : true
        };
        const reqAccessToken = sessionCookie.accessToken;
        if (!reqAccessToken) return {
            success: false,
            isAuthorized: false,
            isRedirect: isEcludeRedirect ? false : true
        };

        // const verifyResult = await jwtVerify(
        //     reqAccessToken,
        //     new TextEncoder().encode(process.env.JWT_SECRET),
        // );

        const accessToken = process.env.ACCESS_TOKEN;
        if (accessToken === reqAccessToken) {
            isAuthorized = true;
        } else {
            isAuthorized = false;
        }


        resObj.success = true;
        resObj.isAuthorized = isAuthorized;
        resObj.isRedirect = isAuthorized ?
            false : isEcludeRedirect ? false : true;
    } catch (err) {
        resObj.success = false;
        resObj.isAuthorized = false;
        resObj.isRedirect = isEcludeRedirect ? false : true;
        console.error(err);
    }


    return resObj;

};
