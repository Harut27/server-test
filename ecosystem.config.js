module.exports = {
    apps : [{
        name: 'reactPanel',
        script: 'npm start',
        mode: 'cluster',
        restart_delay: 3000,
        max_restarts: 20,
    }]
}