import Cookies from "js-cookie";

export const createSession = (data) => {
    const { accessToken, userId, userName, userEmail, accountId } = data;
    const expireTime = 60 * 60 * 24 * 3;
    const sessionCookieData = {
        accessToken: accessToken,
        userId: userId,
        userName: userName,
        userEmail: userEmail,
        accountId: accountId
    };

    const strObj = JSON.stringify(sessionCookieData);
    Cookies.set('session', strObj, { expires: expireTime });
};