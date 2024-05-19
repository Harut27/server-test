#!/bin/bash
# Define your server server details
server_user="root"
ssh_key_path="/home/gor/g_ssh/adroot_l"
server_ip=157.230.111.159
# ssh -i $ssh_key_path $server_user@$server_ip

project_port=7000
project_domain="invoice-maker.xyz"
project_name="reactPanel"
project_dir="/var/www/"$project_name""
certbot_reg_email="inof@adroot.io"
node_version="18.17.1"


nginx_conf_dummy="server {
    listen 80;
    server_name www.invoice-maker.xyz invoice-maker.xyz;
    
    location / {
        return 301 https://invoice-maker.xyz$request_uri;
    }
}"


nginx_conf="
server {
    listen $project_port;
    server_name $server_ip:$project_port;
    
    location / {
        proxy_pass http://localhost:6999;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}"

pm2_ecosystem_conf="module.exports = {
    apps : [{
            name: \"reactPanel\",
            script: \"npm start\",
            mode: \"cluster\",
    }]
};"


#########################################################################################


#log what deploy.sh is doing
ssh -i $ssh_key_path $server_user@$server_ip "
    echo ' '
    echo ' '
    echo '===================================='
    echo '        deploy is running.'
    echo '===================================='
    echo 'Services to be checked/installed:'
    echo ' '
    echo '1.   nginx'
    echo '     nginx configs, sites-available, sites-enabled'
    echo '2.   certbot'
    echo '3.   nvm (node version manager), v0.39.0'
    echo '4.   node v$node_version'
    echo '5.   pm2'
    echo '6.   upload files to server from local  \$(pwd) to $project_dir'
    echo '7.   .env.production as .env file to $project_dir'
    echo '8.   ecosystem.config.js file to $project_dir'
    echo '10.  npm install'
    echo '11.  pm2 start'
    echo '===================================='
    echo ' '
    echo ' '
    echo ' '
"


# # Check if nvm load command is in .bashrc, if not, add it
# ssh -i $ssh_key_path $server_user@$server_ip "
#     # Check if nvm load command is in .bashrc, if not, add it
#     if ! grep -q '^# load nvm and change node default version for all sessions' ~/.bashrc; then
#         echo 'Adding nvm load command to .bashrc...'
#         sed -i '1i # load nvm and change node default version for all sessions' ~/.bashrc
#         sed -i '2i . ~/.nvm/nvm.sh' ~/.bashrc
#         sed -i '3i nvm alias default $node_version' ~/.bashrc
#     else
#         echo 'nvm load command is already in .bashrc'
#     fi
# "



################# nginx start,ssl-certbot #################
#instal nginx
ssh -i $ssh_key_path $server_user@$server_ip "

    if ! which nginx > /dev/null 2>&1; then
        echo "s========= Nginx is not installed."
        echo "s========= installing Nginx."

        sudo apt-get update
        sudo apt-get install nginx

        #nginx allow through firewall
        sudo ufw allow 'Nginx Full'
        # allow project port
        sudo ufw allow $project_port
        #allow ssh
        sudo ufw allow OpenSSH
        #enable firewall
        sudo ufw enable
        #enable nginx
        sudo systemctl enable nginx
        #start nginx
        sudo systemctl start nginx

        #remove default nginx config
        rm /etc/nginx/sites-available/default
        rm /etc/nginx/sites-enabled/default

        #restart nginx
        sudo systemctl restart nginx
    fi

    nginx_status=\$(sudo systemctl is-active nginx)
    if [[ \$nginx_status != "active" ]]; then
        echo "s==Issue==: Nginx service is not active. It is "\$nginx_status
        sudo nginx -t
        sudo tail /var/log/nginx/error.log
        sudo ss -tuln | grep :80
        sudo lsof -i :80
    else
        echo "s========= Nginx service is active."
    fi

"

# DUMMY add or update nginx_conf in sites-available folder,if not exists
# this is done so full config added after ssl certbot
ssh -i $ssh_key_path $server_user@$server_ip "
    if [ ! -f /etc/nginx/sites-available/$project_name ]; then
        # The file does not exist. You can add commands to handle this case here.
        echo 's ======== nginx  === not added to sites-available(enabled too) folder.'
        echo 's ======== nginx  === adding to sites-available(enabled too) folder. First it will be dummy config then after certbot it will be full config.'

        # Write nginx_conf to file, overwriting if it already exists
        echo '$nginx_conf_dummy' > /etc/nginx/sites-available/$project_name || echo 'Error writing to file'

        # Remove the symlink if it exists
        rm -f /etc/nginx/sites-enabled/$project_name

        # Create the symlink
        ln -s /etc/nginx/sites-available/$project_name /etc/nginx/sites-enabled/$project_name || echo 'Error creating symlink'

    else
        echo 's======== nginx configs === OK.'
    fi


"


#install certbot if not installed
ssh -i $ssh_key_path $server_user@$server_ip "
    command -v certbot > /dev/null 2>&1
    certbot_status=\$?
    if [ \$certbot_status -ne 0 ]; then
        echo 's========= certbot is not installed.'
        echo 's========= installing certbot.'
        sudo apt-get update
        sudo apt-get install certbot python3-certbot-nginx
    else
        echo 's========= certbot is installed.'
    fi
"


# full add or update nginx_conf in sites-available folder
ssh -i $ssh_key_path $server_user@$server_ip "
    # Write nginx_conf to a temporary file
    echo '$nginx_conf' > /tmp/$project_name

    # Compare the temporary file with the existing configuration
    if ! diff -q /tmp/$project_name /etc/nginx/sites-available/$project_name > /dev/null 2>&1
    then
        # If the files are different, overwrite the existing configuration with the new one
        mv /tmp/$project_name /etc/nginx/sites-available/$project_name || echo 'Error writing to file'

        # Remove the symlink if it exists
        rm -f /etc/nginx/sites-enabled/$project_name

        # Create the symlink
        ln -s /etc/nginx/sites-available/$project_name /etc/nginx/sites-enabled/$project_name || echo 'Error creating symlink'

        # Restart nginx --- changed to reload
        sudo systemctl reload nginx
        echo 's ========= nginx sites-available(enabled too) folder updated.'
        echo 's ========= nginx restarted.'
    else
        echo 's ========= nginx configuration is identical, no changes made.'
    fi

    # Remove the temporary file
    rm -f /tmp/$project_name
"



################# nginx end #################

# node js and nvm installation
ssh -i $ssh_key_path $server_user@$server_ip "
    # install nvm if not installed
    # Source nvm script
    . ~/.nvm/nvm.sh


    nvm -v > /dev/null 2>&1
    if [ \$? -eq 0 ]; then
        echo 's ======== nvm === is installed.' \$(nvm -v)
    else
        echo 's ======== nvm === is not installed.'
        echo 's ======== nvm === installing nvm'
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        . ~/.nvm/nvm.sh
    fi

    #check if node is installed
    node -v > /dev/null 2>&1
    if [ \$? -eq 0 ]; then
        echo 's ======== node === is installed.' \$(node -v)
    else
        echo 's ======== node === is not installed.'
        echo 's ======== node === installing node'
        nvm install $node_version
    fi
"


# install pm2 if not installed
ssh -i $ssh_key_path $server_user@$server_ip "
    # Source nvm script
    . ~/.nvm/nvm.sh

    which pm2 > /dev/null 2>&1
    if [ \$? -eq 0 ]; then
        echo 's ======== pm2 === is installed.' \$(pm2 -v)
    else
        echo 's ======== pm2 === is not installed.'
        echo 's ======== pm2 === installing pm2'
        # npx install pm2 -g
        npm install pm2 -g
    fi
"


# create project directory if not exists
ssh -i $ssh_key_path $server_user@$server_ip "
    ls $project_dir > /dev/null 2>&1
    if [ \$? -eq 0 ]; then
        echo 's ======== project directory === exists.'
    else
        echo 's ======== project directory === does not exists.'
        echo 's ======== creating project directory.'
        mkdir $project_dir
    fi
"



# Upload files to server
# Define excluded directories and files
excluded_items=("test.txt" "node_modules" "storage" "ggg" ".git" "ssl" "sh" ".env.production" ".env" ".env.local" ".next" "deploy.sh" "reactPanelStore" "var")
excluded_list=$(printf -- "--exclude=%q " "${excluded_items[@]}")

# Copy backend files to the server, preserving the excluded directories and files
local_project_dir=$(pwd) # Get the current directory
rsync -av --delete --ignore-missing-args $excluded_list "$local_project_dir/" -e "ssh -i $ssh_key_path" "$server_user@$server_ip:$project_dir"

#Upload .env.production file to project directory as .env
#remove .env or .env.local file if exists
ssh -i $ssh_key_path $server_user@$server_ip "
    if [ -f $project_dir/.env ]; then
        echo 's ======== .env file === exists.'
        rm $project_dir/.env
    fi
    if [ -f $project_dir/.env.local ]; then
        echo 's ======== .env.local file === exists.'
        rm $project_dir/.env.local
    fi
"
scp -i $ssh_key_path .env.production $server_user@$server_ip:$project_dir/.env

# add/edit ecosystem.config.js and change port and app name
ssh -i $ssh_key_path $server_user@$server_ip "
    # Source nvm script
    . ~/.nvm/nvm.sh

    cd $project_dir
    # Write pm2_ecosystem_conf to file, overwriting if it already exists
    echo '$pm2_ecosystem_conf' > ecosystem.config.js || echo 'Error writing to file'

"

# npm install,build
ssh -i $ssh_key_path $server_user@$server_ip "
    # Source nvm script
    . ~/.nvm/nvm.sh

    cd $project_dir
    npm install
    npm run build
"

#stop/Start the application
ssh -i $ssh_key_path $server_user@$server_ip "
   # Source nvm script
    . ~/.nvm/nvm.sh

    cd $project_dir
    npx pm2 stop all
    npx pm2 start
"



#end log
ssh -i $ssh_key_path $server_user@$server_ip "
    echo ' '
    echo ' '
    echo '===================================='
    echo '        deploy is finished.'
    echo '===================================='
    echo ' '
    echo ' '
    echo ' '
"


