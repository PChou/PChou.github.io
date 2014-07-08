---
layout: postlayout
title: linuxcast视频资源汇总
description: linuxcast是个免费的linux在线视频教学网站，深入浅出，相当不错，但是有的时候网站会说浏览器版本低不能访问（但事实上浏览器没问题）。于是简单对网站的视频地址爬了一把，罗列在此。现在linuxcast已经更新为itercast。
thumbimg: linuxslide.jpg
categories: [resource]
tags: [Linux]
---

<script type="text/javascript" src="http://underscorejs.org/underscore-min.js"></script>
<script type="text/javascript" src="{{ site.baseurl }}/assert/js/data/linuxcast.data.js"></script>
<h3>点击<span class="iconfont">&#xf01cb;</span>可直接播放，点击<a class="iconfont">&#xf01ae;</a>可打开对应笔记。请使用支持html5功能的浏览器</h3>
<blockquote><p>2014/1/5更新：对视频进行分类排序，感谢<a target="_blank" href="http://weibo.com/emmaus3">@那是当然3</a>的建议</p></blockquote>

<h1>抱歉，由于linuxcast视频网站已经关闭了所有服务，本站也无法提供视频服务。关于苏老师为什么关停，请关注<a href="http://www.zhihu.com/question/23871761/answer/25926171" target="_blank">[IterCast 为什么关闭服务？]</a></h1>

<div class='_container'>

<div id="new" style='line-height: 2;'>

</div>
</div>

<script type="text/javascript">

	cawl = _.sortBy(cawl,function (_item) {
		return _item.lib;
	});

	html = [];
	for(var i=0;item=cawl[i];i++){
		html.push('<div><span class="castname">');
		html.push(item.lib + ' - ' + item.course + ' - ' + item.title);
		html.push('</span><a href="javascript:void(0);" class="iconfont pointer" title="视频" data-mp4="');
		html.push(item.src_mp4);
		html.push('" data-webm="');
		html.push(item.src_webm);
		html.push('">&#xf01cb;</a>');
		for(var j=0;n=notes[j];j++){
			if(n.id == item.id){
				html.push('<a class="iconfont pointer" target="_blank" href="');
				html.push(n.link);
				html.push('" title="笔记">&#xf01ae;</a>');
				break;
			}
		}
		html.push('</div>');
	}

	$('div#new').html(html.join(''));


	$('div._container').on('click','.pointer',function(){
		var $this = $(this);
		if(window.myPlayer){
			window.myPlayer.remove();
		}
		window.myPlayer = $('<video controls></video>');
		var s1 = $('<source type="video/mp4"/>').appendTo(window.myPlayer);
		var s2 = $('<source type="video/webm"/>').appendTo(window.myPlayer);
		s1.attr('src',$this.attr('data-mp4'));
		s2.attr('src',$this.attr('data-webm'));
		$this.parent().after(window.myPlayer);
		window.myPlayer.load();
	});

</script>