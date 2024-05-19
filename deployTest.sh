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





# # Upload files to server
# # Define excluded directories and files
# excluded_items=("test.txt" "node_modules" "storage" "ggg" ".git" "ssl" "sh" ".env.production" ".env" ".env.local" ".next" "deploy.sh" "reactPanelStore" "var")
# excluded_list=$(printf -- "--exclude=%q " "${excluded_items[@]}")
# # Copy backend files to the server, preserving the excluded directories and files
# local_project_dir=$(pwd) # Get the current directory
# rsync -av --delete --ignore-missing-args $excluded_list "$local_project_dir/" -e "ssh -i $ssh_key_path" "$server_user@$server_ip:$project_dir"

# folder_to_copy="./app/api/deploy/deployProject.js"
# folder_copy_to="app/api/deploy/deployProject.js"

# scp -i $ssh_key_path $folder_to_copy $server_user@$server_ip:$project_dir/$folder_copy_to


# download package-lock.json
file_todownload="/var/www/invoice-maker/package-lock.json"
local_project_dir=$(pwd) # Get the current directory
scp -i $ssh_key_path $server_user@$server_ip:$file_todownload $local_project_dir/downloads/package-lock.json



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


