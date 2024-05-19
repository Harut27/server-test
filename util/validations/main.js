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


export const validateProjectName = (name) => {
    //allow only -,. and _ in the name

    let isValid = { status: false, message: '' };
    const allowedChars = ['-', '_', '.'];
    const nameChars = name.split('');
    let hasInvalidChars = false;
    nameChars.forEach(char => {
        if (!allowedChars.includes(char) && !char.match(/[a-z0-9]/i)) {
            hasInvalidChars = true;
        }
    });

    if (!hasInvalidChars) {
        isValid.status = true;
    } else {
        isValid.message = 'Name should only contain alphanumeric characters and the special characters hyphen(-), underscore(_) and period(.)';
    }

    return isValid;
}


export const validateDomainName = (name) => {
    let isValid = { status: false, message: '' };

    // Check if the name starts with http:// or https://
    if (/^https?:\/\//i.test(name)) {
        isValid.message = 'Domain name should not start with http:// or https://';
        return isValid;
    }

    // Check if the name contains a dot
    if (!/\./.test(name)) {
        isValid.message = 'Domain name should contain at least one dot(.)';
        return isValid;
    }

    // Regular expression for domain name validation
    const domainRegex = /^([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;

    if (domainRegex.test(name)) {
        isValid.status = true;
    } else {
        isValid.message = 'Domain name should only contain alphanumeric characters, hyphen(-), underscore(_), and dots(.)';
    }

    return isValid;
}

export const validateEmail = (email) => {
    let isValid = { status: false, message: '' };

    // Regular expression for email validation
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

    if (emailRegex.test(email)) {
        isValid.status = true;
    } else {
        isValid.message = 'Invalid email address';
    }

    return isValid;
}