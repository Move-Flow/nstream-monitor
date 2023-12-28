# Devops
## Init
```bash
git clone git@github.com:Move-Flow/nstream-monitor.git
cd nstream-monitor
ayrn
cd src/
git clone git@github.com:Move-Flow/flow-frontend.git
find ./flow-frontend -mindepth 1 ! -regex '^./flow-frontend/src\(/.*\)?' -delete
cd flow-frontend/
find ./src -mindepth 1 ! -regex '^./src/config\(/.*\)?' -delete
 ```