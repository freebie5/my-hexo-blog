(function () {
    // alert("hello");
    console.log("hhhhh");
    let data;
    function loadData() {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', './index.json?t=' + +new Date(), true);
        xhr.onload = function() {
            if (this.status >= 200 && this.status < 300) {
                let res = JSON.parse(this.response);
                console.log(res);
                data = res;
                createList();
            } else {
                console.error(this.statusText);
            }
        };
        xhr.onerror = function() {
            console.error(this.statusText);
        };
        xhr.send();
    }

    //获取json
    loadData();

    // <div>
    //     <div>测试</div>
    //     <div>
    //         <ul>
    //             <li><a href="/2020/07/09/CentOS7安装ZooKeeper">测试</a></li>
    //             <li>测试</li>
    //             <li>测试</li>
    //             <li>测试</li>
    //         </ul>
    //     </div>
    // </div>
    
    //生成列表
    function createList() {
        let list = document.getElementById("list");
        let categories = data.categories;
        for(let i=0;i<categories.length;i++) {
            let cateDiv = document.createElement("div");
            //分类名称
            let name = categories[i].name;
            let titleDiv = document.createElement("div");
            titleDiv.innerHTML = name;
            cateDiv.appendChild(titleDiv);
            //文章
            let articles = categories[i].articles;
            let articleDiv = document.createElement("div");
            let articleUl = document.createElement("ul");
            articleDiv.appendChild(articleUl);
            for(let j=0;j<articles.length;j++) {
                //
                let articleLi = document.createElement("li");
                //链接
                let url = articles[j].path;
                let name = articles[j].name;
                let isShow = articles[j].isShow;
                let articleA = document.createElement("a");
                articleA.href = url;
                articleA.innerHTML = name;
                articleLi.appendChild(articleA);
                if(isShow) {
                    articleUl.appendChild(articleLi);
                }

            }
            cateDiv.appendChild(articleDiv);
            list.appendChild(cateDiv);
        }
    }

})()