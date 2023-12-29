# Devops
## Init
```bash
git clone git@github.com:Move-Flow/nstream-monitor.git
cd nstream-monitor
yarn
cd src/
git clone git@github.com:Move-Flow/flow-frontend.git
find ./flow-frontend -mindepth 1 ! -regex '^./flow-frontend/src\(/.*\)?' -delete
cd flow-frontend/
find ./src -mindepth 1 ! -regex '^./src/config\(/.*\)?' -delete
# setup .env
 ```
 ## Dev
 ```bash
cd nstream-monitor
yarn start:dev
 ```

## Deploy
 ```bash
cd nstream-monitor
# update .env if necessary
yarn start:tmp
 ```
