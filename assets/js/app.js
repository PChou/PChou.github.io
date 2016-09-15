var BlogDirectory = {
    /*
        获取元素位置，距浏览器左边界的距离（left）和距浏览器上边界的距离（top）
    */
    getElementPosition:function (ele) {        
        var topPosition = 0;
        var leftPosition = 0;
        while (ele){              
            topPosition += ele.offsetTop;
            leftPosition += ele.offsetLeft;        
            ele = ele.offsetParent;     
        }  
        return {top:topPosition, left:leftPosition}; 
    },

    /*
    获取滚动条当前位置
    */
    getScrollBarPosition:function () {
        var scrollBarPosition = document.body.scrollTop || document.documentElement.scrollTop;
        return  scrollBarPosition;
    },
    
    /*
    移动滚动条，finalPos 为目的位置，internal 为移动速度
    */
    moveScrollBar:function(finalpos, interval) {

        //若不支持此方法，则退出
        if(!window.scrollTo) {
            return false;
        }

        //窗体滚动时，禁用鼠标滚轮
        window.onmousewheel = function(){
            return false;
        };
          
        //清除计时
        if (document.body.movement) { 
            clearTimeout(document.body.movement); 
        } 

        var currentpos =BlogDirectory.getScrollBarPosition();//获取滚动条当前位置

        var dist = 0; 
        if (currentpos == finalpos) {//到达预定位置，则解禁鼠标滚轮，并退出
            window.onmousewheel = function(){
                return true;
            }
            return true; 
        } 
        if (currentpos < finalpos) {//未到达，则计算下一步所要移动的距离
            dist = Math.ceil((finalpos - currentpos)/10); 
            currentpos += dist; 
        } 
        if (currentpos > finalpos) { 
            dist = Math.ceil((currentpos - finalpos)/10); 
            currentpos -= dist; 
        }
        
        var scrTop = BlogDirectory.getScrollBarPosition();//获取滚动条当前位置
        window.scrollTo(0, currentpos);//移动窗口
        if(BlogDirectory.getScrollBarPosition() == scrTop)//若已到底部，则解禁鼠标滚轮，并退出
        {
            window.onmousewheel = function(){
                return true;
            }
            return true;
        }
        
        //进行下一步移动
        var repeat = "BlogDirectory.moveScrollBar(" + finalpos + "," + interval + ")"; 
        document.body.movement = setTimeout(repeat, interval); 
    },
    
    htmlDecode:function (text){
        var temp = document.createElement("div");
        temp.innerHTML = text;
        var output = temp.innerText || temp.textContent;
        temp = null;
        return output;
    },

    /*
    创建博客目录，
    el: 文章内容的容器jquery 对象，
    mt 和 st 分别表示主标题和次级标题的标签名称（如 H2、H3，大写或小写都可以！），
    interval 表示移动的速度
    */
    createBlogDirectory:function (el, mt, st, interval){
         //获取博文正文div容器
        if(!el || el.length < 1) return false;
        //获取div中所有元素结点mt和st元素
        var nodes = el.find(mt+','+st);
        //创建博客目录的div容器
        var divSideBar = $('#sideBar');
        var divSideBarTab = $('<div class="sideBar" id="sideBarTab"></div>');
        divSideBar.append(divSideBarTab);
        //目录导航字样
        var title = $('<h4>目录导航</h4>');
        divSideBarTab.append(title);
        
        //目录容器
        var divSideBarContents = $('<div id="sideBarContents"></div>');
        divSideBar.append(divSideBarContents);

        //创建自定义列表
        var dlist = $("<dl></dl>");
        divSideBarContents.append(dlist);
        var num = 0;//统计找到的mt和st
        mt = mt.toUpperCase();//转化成大写
        st = st.toUpperCase();//转化成大写

        //遍历所有元素结点
        $.each(nodes,function(){
        	var $this = $(this);
        	var nodetext = $this.text().replace(/<\/?[^>]+>/g,""); //innerHTML里面的内容可能有HTML标签，所以用正则表达式去除HTML的标签
        	nodetext = nodetext.replace(/&nbsp;/ig, "");//替换掉所有的&nbsp;
        	nodetext = BlogDirectory.htmlDecode(nodetext);

        	$this.attr("id", "blogTitle" + num);
        	var item;
        	switch($this.get(0).tagName)
            {
                case mt:    //若为主标题 
                    item = $("<dt></dt>");
                    break;
                case st:    //若为子标题
                    item = $("<dd></dd>");
                    break;
            }

            //创建锚链接
            item.text(nodetext);
            item.attr("name", num);
            item.click(function(){        //添加鼠标点击触发函数
                var pos = BlogDirectory.getElementPosition(document.getElementById("blogTitle" + this.getAttribute("name")));
                if(!BlogDirectory.moveScrollBar(pos.top, interval)) return false;
            });

            //将自定义表项加入自定义列表中
            dlist.append(item);
            num++;
        })

        if(num == 0) return false; 
    }
    
};


jQuery(function($) {
    $(document).ready( function() {
    /* Sidebar height set */
        //$('.sidebar').css('min-height',$(document).height());

        /* qrcode */
        var opt = { text : window.location.href, width:100, height:100 };
        try {
            document.createElement("canvas").getContext("2d");
        } catch (e) {
            $.extend(opt,{ render : "table" });
        }

        $('.qrcode').html('').qrcode(opt);

        /*页面加载完成之后生成博客目录*/
        BlogDirectory.createBlogDirectory($("#article_body"),"h2","h3",10);
        //stick
        $('#sideBar').stickUp();
    });
});