export const validateDbname = (name) => {
    let isValid = { status: false, message: '' };
    //should not container special characters except _
    const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=', '{', '}', '[', ']', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '?', '/', '~', '`'];
    const nameChars = name.split('');
    let hasSpecialChars = false;
    nameChars.forEach(char => {
        if (specialChars.includes(char)) {
            hasSpecialChars = true;
        }
    });

    if (!hasSpecialChars) {
        isValid.status = true;
    } else {
        isValid.message = 'Name should not contain special characters except underscore(_)';
    }
    return isValid;
};