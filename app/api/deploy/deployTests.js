 // //log npm version
    // const npmVersionRes = await executeLinuexCommands([{
    //     command: 'npm',
    //     args: ['--version'],
    //     env: { ...process.env },
    //     dir: projectPath
    // }]);

    // //clear npm cache
    // const npmCacheRes = await executeLinuexCommands([{
    //     command: 'npm',
    //     args: ['cache', 'clean', '--force'],
    //     env: { ...process.env },
    //     dir: projectPath
    // }]);
    // console.log('npmCacheRes: ', npmCacheRes);

    // // npm audit config 
    // const npmAuditConfigRes = await executeLinuexCommands([{
    //     command: 'npm',
    //     args: ['set', 'audit-level', 'high'],
    //     env: { ...process.env },
    //     dir: projectPath

    // }]);
    // console.log('npmAuditConfigRes: ', npmAuditConfigRes);

    // //depencency tree
    // const npmDepTreeRes = await executeLinuexCommands([{
    //     command: 'npm',
    //     args: ['ls'],
    //     env: { ...process.env },
    //     dir: projectPath

    // }]);
    // console.log('npmDepTreeRes: ', npmDepTreeRes);


    // //log node version
    // const nodeVersionRes = await executeLinuexCommands([{
    //     command: 'node',
    //     args: ['--version'],
    //     env: { ...process.env },
    //     dir: projectPath

    // }]);
    // console.log('nodeVersionRes: ', nodeVersionRes);



    // //show current location and list files
    // const lsRes = await executeLinuexCommands([{
    //     command: 'ls',
    //     args: ['-la'],
    //     dir: projectPath,
    //     env: { ...process.env },
    // }]);
    // console.log('lsRes: ', lsRes);

    // delete lock json


      // ***********************
    // TEST 2 FOR ENV
    // ***********************

    // const newEnv = {
    //     SHELL: '/bin/bash',
    //     NVM_INC: '/root/.nvm/versions/node/v18.17.1/include/node',
    //     PWD: '/var/www/invoice-maker',
    //     LOGNAME: 'root',
    //     XDG_SESSION_TYPE: 'tty',
    //     HOME: '/root',
    //     LANG: 'C.UTF-8',
    //     LS_COLORS: 'rs=0:di=01;34:ln=01;36:mh=00:pi=40;33:so=01;35:do=01;35:bd=40;33;01:cd=40;33;01:or=40;31;01:mi=00:su=37;41:sg=30;43:ca=00:tw=30;42:ow=34;42:st=37;44:ex=01;32:*.tar=01;31:*.tgz=01;31:*.arc=01;31:*.arj=01;31:*.taz=01;31:*.lha=01;31:*.lz4=01;31:*.lzh=01;31:*.lzma=01;31:*.tlz=01;31:*.txz=01;31:*.tzo=01;31:*.t7z=01;31:*.zip=01;31:*.z=01;31:*.dz=01;31:*.gz=01;31:*.lrz=01;31:*.lz=01;31:*.lzo=01;31:*.xz=01;31:*.zst=01;31:*.tzst=01;31:*.bz2=01;31:*.bz=01;31:*.tbz=01;31:*.tbz2=01;31:*.tz=01;31:*.deb=01;31:*.rpm=01;31:*.jar=01;31:*.war=01;31:*.ear=01;31:*.sar=01;31:*.rar=01;31:*.alz=01;31:*.ace=01;31:*.zoo=01;31:*.cpio=01;31:*.7z=01;31:*.rz=01;31:*.cab=01;31:*.wim=01;31:*.swm=01;31:*.dwm=01;31:*.esd=01;31:*.avif=01;35:*.jpg=01;35:*.jpeg=01;35:*.mjpg=01;35:*.mjpeg=01;35:*.gif=01;35:*.bmp=01;35:*.pbm=01;35:*.pgm=01;35:*.ppm=01;35:*.tga=01;35:*.xbm=01;35:*.xpm=01;35:*.tif=01;35:*.tiff=01;35:*.png=01;35:*.svg=01;35:*.svgz=01;35:*.mng=01;35:*.pcx=01;35:*.mov=01;35:*.mpg=01;35:*.mpeg=01;35:*.m2v=01;35:*.mkv=01;35:*.webm=01;35:*.webp=01;35:*.ogm=01;35:*.mp4=01;35:*.m4v=01;35:*.mp4v=01;35:*.vob=01;35:*.qt=01;35:*.nuv=01;35:*.wmv=01;35:*.asf=01;35:*.rm=01;35:*.rmvb=01;35:*.flc=01;35:*.avi=01;35:*.fli=01;35:*.flv=01;35:*.gl=01;35:*.dl=01;35:*.xcf=01;35:*.xwd=01;35:*.yuv=01;35:*.cgm=01;35:*.emf=01;35:*.ogv=01;35:*.ogx=01;35:*.aac=00;36:*.au=00;36:*.flac=00;36:*.m4a=00;36:*.mid=00;36:*.midi=00;36:*.mka=00;36:*.mp3=00;36:*.mpc=00;36:*.ogg=00;36:*.ra=00;36:*.wav=00;36:*.oga=00;36:*.opus=00;36:*.spx=00;36:*.xspf=00;36:*~=00;90:*#=00;90:*.bak=00;90:*.crdownload=00;90:*.dpkg-dist=00;90:*.dpkg-new=00;90:*.dpkg-old=00;90:*.dpkg-tmp=00;90:*.old=00;90:*.orig=00;90:*.part=00;90:*.rej=00;90:*.rpmnew=00;90:*.rpmorig=00;90:*.rpmsave=00;90:*.swp=00;90:*.tmp=00;90:*.ucf-dist=00;90:*.ucf-new=00;90:*.ucf-old=00;90:',
    //     SSH_CONNECTION: '37.252.90.204 61214 157.230.111.159 22',
    //     NVM_DIR: '/root/.nvm',
    //     LESSCLOSE: '/usr/bin/lesspipe %s %s',
    //     XDG_SESSION_CLASS: 'user',
    //     TERM: 'xterm-256color',
    //     LESSOPEN: '| /usr/bin/lesspipe %s',
    //     USER: 'root',
    //     SHLVL: '1',
    //     NVM_CD_FLAGS: '',
    //     XDG_SESSION_ID: '1304',
    //     XDG_RUNTIME_DIR: '/run/user/0',
    //     SSH_CLIENT: '37.252.90.204 61214 22',
    //     XDG_DATA_DIRS: '/usr/local/share:/usr/share:/var/lib/snapd/desktop',
    //     PATH: '/root/.nvm/versions/node/v18.17.1/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin',
    //     DBUS_SESSION_BUS_ADDRESS: 'unix:path=/run/user/0/bus',
    //     NVM_BIN: '/root/.nvm/versions/node/v18.17.1/bin',
    //     SSH_TTY: '/dev/pts/0',
    //     _: '/root/.nvm/versions/node/v18.17.1/bin/node',
    //     OLDPWD: '/var/www',
    //     // OS: 'linux',
    // }

    // let currentEnv = { ...process.env };
    // const currentKeys = Object.keys(currentEnv);
    // const newKeys = Object.keys(newEnv);

    /// TEST WITH CHANGING ENV
    // const tests = [];
    // newKeys.forEach((key) => {
    //     let changedEnv = JSON.parse(JSON.stringify(currentEnv));
    //     changedEnv[key] = newEnv[key];
    //     tests.push({
    //         key: key,
    //         env: changedEnv
    //     });
    // });


    // let correctedEnv = JSON.parse(JSON.stringify(currentEnv));
    // const differntKeys = currentKeys.filter((key) => !newKeys.includes(key));
    // newKeys.forEach((key) => {
    //     correctedEnv[key] = newEnv[key];
    // });

    // const tests = [];
    // differntKeys.forEach((key) => {
    //     let changedEnv = JSON.parse(JSON.stringify(correctedEnv));
    //     delete changedEnv[key];
    //     tests.push({
    //         key: key,
    //         env: changedEnv
    //     });
    // });

    // for (const test of tests) {
    //     const npmTestRes = await executeLinuexCommands([{
    //         command: 'npm',
    //         args: ['i'],
    //         dir: projectPath,
    //         env: test.env,
    //     }]);
    //     console.log('key : ', test.key);
    //     console.log('npmTestRes: ', npmTestRes);
    // }
