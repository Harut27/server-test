import Cookies from 'js-cookie'

export const createCookie = (name, value, daysToExpire) => {
    let resObj = {
        success: false,
        message: 'Failed to create cookie'
    }

    try {
        let nVal = value;
        const isObj = typeof value === 'object';
        const isArr = Array.isArray(value);
        const isStr = typeof value === 'string';

        if (isObj || isArr) {
            nVal = JSON.stringify(nVal);
        }

        const expData = new Date();
        expData.setDate(expData.getDate() + daysToExpire);

        Cookies.set(name, nVal, {
            expires: expData
        });

        resObj.success = true;
        resObj.message = 'Cookie created successfully';


    } catch (err) {
        console.error(err)
        resObj.success = false;
        resObj.message = 'Failed to create cookie';

    }

    return resObj;
}

export const deleteCookie = (name) => {
    let resObj = {
        success: false,
        message: 'Failed to delete cookie'
    }

    try {
        Cookies.remove(name);
        resObj.success = true;
        resObj.message = 'Cookie deleted successfully';

    } catch (err) {
        console.error(err)
        resObj.success = false;
        resObj.message = 'Failed to delete cookie';

    }

    return resObj;
}