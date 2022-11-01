const path = require('path');
const fs = require('fs');
const {getArgs} = require('../common/args');
const { exec, execSync } = require('child_process');
const { my_path } = require('../../myconfig');

class MyBuilder {

    config;
    // build
    constructor() {
        const args = getArgs();
        this.config = Object.assign({
            dist: './dist',
            distPath: my_path.dist,
            baseHref: `file://${my_path.dist}/`
        }, args);
        if(args && typeof args.baseHref !== 'string' && typeof args.repo === 'string') {
            const _repo  = args.repo.split('/');
            if(_repo.length>1) {
                if(_repo[0].toLowerCase() === 'arthusliang') {
                    this.config.baseHref = `https://jsonic.net/${_repo[1]}/`.toLowerCase();
                } else {
                    this.config.baseHref = `https://${_repo[0]}.github.io/${_repo[1]}/`.toLowerCase();
                }
            }
        }
    }

    async ngBuild() {
        return new Promise((resolve, reject)=>{
            exec(`ng build momentum --output-path '${this.config.dist}' --configuration=production --base-href '${this.config.baseHref}'`, (err, stdout, stderr) => {
                const list = fs.readdirSync(this.config.distPath);
                list.forEach((fileName)=>{
                    const _folder = path.join(this.config.distPath, fileName);
                    const stat = fs.lstatSync(_folder);
                    if(stat.isDirectory() ) {
                        const fileIndex = path.join(_folder,'index.html');
                        const file404 = path.join(_folder,'404.html');
                        if(fs.existsSync(fileIndex)){
                            fs.copyFileSync(fileIndex, file404);
                        }
                        // detele language
                        const _assetDataPath = path.join(_folder, 'assets/data');
                        if(fs.existsSync(_assetDataPath)) {
                            const languages = fs.readdirSync(_assetDataPath);
                            languages.forEach((lang)=>{
                                const __path = path.join(_assetDataPath, lang);
                                const _stat = fs.lstatSync(__path);
                                if(_stat.isDirectory() && lang!==fileName) {
                                    execSync(`rm -rf ${path.relative(path.resolve(this.config.distPath,'../'),__path)}`);
                                }
                            });
                        }
                    }
                });
                this.build404();
                resolve(1);
            });
        });
    }

    async build404() {
        const _404Html =`<!DOCTYPE html>
<html>
    <head>
        <title>Momentum</title>
        <meta http-equiv="Access-Control-Allow-Origin" content="*">
        <meta http-equiv="Content-type" content="text/html; charset=utf-8">
        <script>
            let regHttp = /^http:\\\/\\\//;
            if(regHttp.test(location.href)) {
                location.href = location.href.replace(regHttp, 'https:\\\/\\\/');
            } else {
                let baseUrl = '${this.config.baseHref}';
                let path = location.href.replace(baseUrl,'');
                let arr = path.split('/');
                if(arr.length>0) {
                    let lang = arr[0];
                    let restUrl = arr.slice(1).join('/');
                    location.href = baseUrl+lang+'/#/'+restUrl;
                }                
            }
        </script>
    </head>
    <body></body>
</html>`;
        fs.writeFileSync(path.join(this.config.distPath, '404.html'), _404Html);
    }

    async build() {
        await this.ngBuild();
    }

}

new MyBuilder().build();