import { notify } from '../../util/notify/notifyMain';


export const excFetch = async (props) => {

    const {
        url,
        method,
        body
    } = props;

    const fetchData = {
        url,
        method,
        body
    };


    try {

        const response = await fetch(
            fetchData.url,
            {
                method: fetchData.method,
                // headers: newHeaders,
                body: fetchData.body
            }
        );
        const parsedRes = await response.json();

        if (!response.ok || !parsedRes.success) {
            notify("error", parsedRes.message);
        }

        let isNotGet = false;
        const parsedBody = JSON.parse(fetchData.body);
        isNotGet = parsedBody.action !== 'GET';
        console.log("response: ", response);
        if (response.ok && isNotGet) {
            // notify("success", parsedRes.message);
        }

        return parsedRes;


    } catch (error) {
        console.log("error: ", error);
        return { success: false, message: "Something went wrong" }
    }
};