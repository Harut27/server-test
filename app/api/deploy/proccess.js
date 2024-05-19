//utillity functions
export const getProccessJson = async (proccessName) => {
    let resObj = {
        success: false,
        message: "Forbidden",
        isProccess: false,
        data: {}
    };

    try {
        const proccessJsonPath = `/var/www/reactPanel/reactPanelStore/proccesses/${proccessName}.json`;
        const isFileExist = fs.existsSync(proccessJsonPath);
        if (!isFileExist) {
            resObj.success = true;
            resObj.isProccess = false;
            resObj.message = "No active Proccesses";
            return resObj;
        }

        const proccessJson = fs.readFileSync(proccessJsonPath);
        const r = JSON.parse(proccessJson);

        resObj.success = true;
        resObj.message = "Proccess json fetched successfully";
        resObj.data = r;
    } catch (error) {
        resObj.success = false;
        resObj.message = "Error fetching proccess json, " + error;
        console.error("error: ", error);
    }

    return resObj;
};

export const getProccesNameFromUrl = (url) => {
    //pn= is the query parameter for proccess name
    let isProccessReq = false;
    let proccessName = null;
    const a1 = url.split('?');
    const a2 = a1[1].split('&');

    a2.forEach(e => {
        const a3 = e.split('=');
        if (a3[0] === 'ty' && a3[1] === 'proccess') {
            isProccessReq = true;
        }
    });

    a2.forEach(e => {
        const a3 = e.split('=');
        if (a3[0] === 'pn' && isProccessReq) {
            proccessName = a3[1];
        }
    });


    return proccessName;
};