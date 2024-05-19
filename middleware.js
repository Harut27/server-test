// export { default } from "next-auth/middleware";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { checkAuth } from "./util/auth/default"

const singInPath = '/auth/signin';
const middleware = async (req) => {

    const hostName = req.headers.get("host");
    let port = req.headers.get("x-forwarded-port");
    port = port === "80" ? 7000 : port ; //6999->7000
    port = port === "443" ? "" : port; //443->""
    const hostNameWithPort = !hostName.includes(port) ? hostName + (port ? ':' + port : '') : hostName;
    const authRes = await checkAuth(req);
    const reqPath = req.nextUrl.pathname;

    //redirect to signin page if not authorized
    const isAuthorized = authRes.isAuthorized;
    if (authRes.isRedirect) {
        const protocol = req.headers.get("x-forwarded-proto") || "https";
        const isTheSameUrl = reqPath === singInPath;
        if (isTheSameUrl) {
            return NextResponse.next();
        } else {
            const redirectUrl = protocol + '://' + `${hostNameWithPort + singInPath}`;
            // console.log("redirectUrl: ", redirectUrl, '  port: ', port);
            return NextResponse.redirect(redirectUrl);
        }

    }else{
        return NextResponse.next(); 
    }
};

export default middleware;