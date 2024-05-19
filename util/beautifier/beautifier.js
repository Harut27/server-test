export const beautifyStr = (str) => {
    let newStr = str;

    if (newStr === 'clientsId') {
        newStr = 'Client ID';
    } else if (newStr === 'accountId') {
        newStr = 'Account ID';
    }  else if (newStr === 'yourCompaniesId') {
        newStr = 'Your Company';
    } 


    //remove extra spaces
    newStr = newStr.replace(/\s+/g, ' ');

    //remove extra newlines
    newStr = newStr.replace(/\n+/g, '\n');

    //make capital first letter
    newStr = newStr.charAt(0).toUpperCase() + newStr.slice(1);

    //if string is a camelCase, add space before capital letter
    newStr = newStr.replace(/([A-Z])/g, ' $1');



    return newStr;
};