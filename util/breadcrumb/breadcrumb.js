

export const getBreadcrumbFromPath = (path) => {
    const arr = [];

    if (path && path === '/') {
        arr.push({
            name: 'Home',
            path: '/',
            label: 'Home',
            link: '/',
            active: true
        });
    } else {
        const pathArray = path.split('/');
        let linkPath = '';
        pathArray.forEach((pth, index) => {
            if (pth && pth !== '') {
                linkPath += `/${pth}`;
                arr.push({
                    name: pth,
                    path: pth,
                    label: pth,
                    link: linkPath,
                    active: index === pathArray.length - 1 ? true : false
                });
            }
        });
    }

    //if home is not in the path add it
    if (path && path !== '/' && arr[0].name.toLowerCase() !== 'home') {
        arr.unshift({
            name: 'Home',
            path: '/',
            label: 'Home',
            link: '/',
            active: false
        });
    }

    return arr;
}