---
layout: postlayout
title: IOS状态栏和导航栏的控制问题
categories: [IOS]
tags: [objective-c,ios]
---

IOS的项目多数会遇到控制状态栏和导航栏的问题，比如隐藏状态栏、控制状态栏的文字颜色等，导航栏也有同样需求。本文总结一下操作方法。

首先一点，IOS的界面分为状态栏和导航栏，状态栏是指显示电池、时间的最顶部的一个窄条，高度为20个点；而导航栏是紧接着状态栏的44个点高度的横条，一般用于显示app标题，返回按钮等操作按钮。

在ios7之前，状态栏和导航栏是分开的，而从ios7开始状态栏和导航栏交织在一起了，状态栏变为透明，导航栏的高度变为44+20=64：

![](http://pchou.qiniudn.com/oc-status-bar-00.jpg)

## 状态栏控制

对状态栏的控制分两种情况：全局设置和分页面设置。控制这两种模式的开关是`info.plist`文件的`View controller-based status bar appearance`配置项。

### 全局设置状态栏

将`info.plist`文件的`View controller-based status bar appearance`设置为`NO`，即可开启全局设置，也就是说你在VC中对状态栏的控制都将无效，相比之下，是通过下面的代码来全局控制：

{% highlight objectivec %}

//设置状态栏的字体颜色模式
[[UIApplication sharedApplication] setStatusBarStyle:UIStatusBarStyleLightContent];
//设置状态栏是否隐藏
[[UIApplication sharedApplication] setStatusBarHidden:YES];

{% endhighlight %}

注意，我们并不能对状态栏的字体颜色做任意的控制，只有两种选择`UIStatusBarStyleDefault`和`UIStatusBarStyleLightContent`，前者是默认的黑色，而后者是白色。也就是说如果你的背景色是偏深色，那么设置状态栏的字体颜色为白色。另外，我们可以全局设置状态栏是否显示，但是一般而言app不会对所有界面都不显示状态栏，而是只在特定的页面需要隐藏状态栏，比如对于视频播放界面不希望显示状态栏。

对于状态栏的背景色设置，上面提到从ios7开始状态栏本身实际上是透明的，它的背景色其实取决于导航栏的背景色。下面会讲导航栏的设置。

### 分页面设置状态栏

将`info.plist`文件的`View controller-based status bar appearance`设置为`YES`，即可开启由VC来控制状态栏的功能，在这种模式下，全局的设置将无效！！所以我们必须逐个页面对状态栏进行设置，否则状态栏将维持默认的黑色字体和默认为显示状态。

#### 字体设置

对于设置状态栏字体颜色，分两种情况：VC是否属于`UINavigationController`中：

1) 当VC不在`UINavigationController`中时，在VC中添加一个方法

{% highlight objectivec %}

- (UIStatusBarStyle)preferredStatusBarStyle
{ 
    //返回白色
    return UIStatusBarStyleLightContent;
    //返回黑色
    //return UIStatusBarStyleDefault;
}

{% endhighlight %}

保险起见，在view的某个加载阶段比如`viewWillAppear`中，执行：

{% highlight objectivec %}

[self setNeedsStatusBarAppearanceUpdate];

{% endhighlight %}


2) 当VC在`UINavigationController`中时，VC并不能通过1)的方式控制状态栏的颜色，详见本文后面的参考资料，那么这个时候，有一个trick的方法可以在VC中间接的控制：

{% highlight objectivec %}

self.navigationController.navigationBar.barStyle = UIBarStyleBlack;

{% endhighlight %}

#### 隐藏控制

对于控制状态栏的隐藏同样存在VC是否是根控制器的问题，也就说只有根控制器才能直接控制状态栏的显示与否。

1) 如果是VC本身就是根控制器，那么在VC中添加如下代码：

{% highlight objectivec %}

- (BOOL)prefersStatusBarHidden {
    return YES;
}

{% endhighlight %}

当然，保险起见，在适当的时候调用

{% highlight objectivec %}

[self setNeedsStatusBarAppearanceUpdate];

{% endhighlight %}

2) 如果VC不是根控制器，那么不像控制字体颜色那样有trick，我们只能间接的通过在子VC中控制根VC，从而间接控制根控制器。那么这个方法就很多了，比如我的根VC是个tab的VC，首先现在tab的VC中，实现1)：

{% highlight objectivec %}

@interface YYCTabBarController : RDVTabBarController

//定义一个变量来控制状态栏显示，子VC通过修改这个值来间接控制
@property (nonatomic,assign)BOOL statusBarHidden;

@end

@implementation YYCTabBarController

- (BOOL)prefersStatusBarHidden {
    return _statusBarHidden;
}

@end

{% endhighlight %}

在子VC中：

{% highlight objectivec %}

- (void)viewWillAppear:(BOOL)animated{
    [super viewWillAppear:animated];
    
    //rdv_tabBarController指向YYCTabBarController
    if([self.rdv_tabBarController respondsToSelector:@selector(setStatusBarHidden:)]){
        [self.rdv_tabBarController performSelector:@selector(setStatusBarHidden:) withObject:@(YES)];
        [self setNeedsStatusBarAppearanceUpdate];
    }
}

- (void)viewWillDisappear:(BOOL)animated{
    [super viewWillDisappear:animated];
    
    if([self.rdv_tabBarController respondsToSelector:@selector(setStatusBarHidden:)]){
        //注意对NO的情况，不能传@NO，只能传nil才能被当成NO
        [self.rdv_tabBarController performSelector:@selector(setStatusBarHidden:) withObject:nil];
        [self setNeedsStatusBarAppearanceUpdate];
    }
}

{% endhighlight %}

可以看到在子VC中通过设置根VC的属性，并调用`setNeedsStatusBarAppearanceUpdate`后，根VC的`prefersStatusBarHidden`就会被调用，从而隐藏或显示状态栏。


## 导航栏控制

### 背景控制

在IOS7中使用`barTintColor`来控制导航栏的背景色:

{% highlight objectivec %}

[[UINavigationBar appearance] setBarTintColor:[UIColor yellowColor]]; 

{% endhighlight %}

![](http://pchou.qiniudn.com/oc-statusbar-01.jpg)

这个设置方法可以在`AppDelegate`中设置，全局可以生效。

如果希望使用图片来作为导航的背景，那么需要注意的是ios7中图片的高度问题。上面提到过了，ios7导航栏的高度其实是算上状态栏的，即44+20=64个点的高度。可以通过`setBackgroundImage`来设置：

{% highlight objectivec %}

[[UINavigationBar appearance] setBackgroundImage:[UIImage imageNamed:@ "nav_bg.png" ] forBarMetrics:UIBarMetricsDefault]; 

{% endhighlight %}


![](http://pchou.qiniudn.com/oc-statusbar-03.jpg)


### 前景控制

前景控制分为标题控制和返回按钮(等系统按钮)的控制

标题需要通过`setTitleTextAttributes`来设置，相对比较复杂一些，例如：

{% highlight objectivec %}

NSShadow *shadow = [[NSShadow alloc] init]; 
shadow.shadowColor = [UIColor colorWithRed:0.0 green:0.0 blue:0.0 alpha:0.8]; 
shadow.shadowOffset = CGSizeMake(0, 1); 
[[UINavigationBar appearance] setTitleTextAttributes: [NSDictionary dictionaryWithObjectsAndKeys: 
        [UIColor colorWithRed:245.0/255.0 green:245.0/255.0 blue:245.0/255.0 alpha:1.0], NSForegroundColorAttributeName, 
        shadow, NSShadowAttributeName, 
        [UIFont fontWithName:@ "HelveticaNeue-CondensedBlack"  size:21.0], NSFontAttributeName, nil]]; 

{% endhighlight %}

![](http://pchou.qiniudn.com/oc-statusbar-04.jpg)

设置返回按钮(等系统按钮)可以通过`TintColor`，直接来设置颜色

{% highlight objectivec %}

[[UINavigationBar appearance] setTintColor:[UIColor whiteColor]];

{% endhighlight %}

![](http://pchou.qiniudn.com/oc-statusbar-05.jpg)

### 显示设置

有时我们希望导航栏不显示，而有时又希望显示，那么最好通过每个个体的VC来控制，如果某个VC需要与其他VC有所区别，那么最好是“负责到底”，即在进入VC时改变导航栏的显示状态，而退出时还原：

{% highlight objectivec %}

- (void) viewWillAppear:(BOOL)animated {
    [super viewWillAppear:animated];
    [self.navigationController.navigationBar setHidden:YES];
    [self.rdv_tabBarController setTabBarHidden:YES animated:NO];
}

- (void) viewWillDisappear:(BOOL)animated {
    [super viewWillDisappear:animated];
    [self.navigationController.navigationBar setHidden:NO];
    [self.rdv_tabBarController setTabBarHidden:NO animated:NO];
}

{% endhighlight %}

### 如何在有导航栏的情况下定位控件的Y

可能初学ios的同学(尤其是通过手写代码布局的同学)都会有这么个感受，为什么我的控件有的时候明明定位在VC上，但会被导航栏遮住，那么你可能会得出结论原点(0,0)是在屏幕的左上角被导航栏遮住的；而对于像`UITableView`这样的，设置了全屏铺满，怎么就没有被导航栏遮住呢？原点难道不在左上角？

笔者被这个问题困扰了很久，这里谈一下最近的一个理解。我们拿`UITextView`来看

当我们把一个`UITextView`放到一个没有导航的VC中时：

{% highlight objectivec %}

UITextView *textView = [[UITextView alloc] init];
textView.frame = CGRectMake(10, 200, 300, 120);
textView.backgroundColor = [UIColor redColor];
textView.text = @"游戏分两种,一种是在生活中玩的,另一种是生活在其中的。这两个世界相互矛盾,而两位约翰就分别属于这不同的世界。";
textView.font = [UIFont boldSystemFontOfSize:40];
textView.editable = NO;
[self.view addSubview:textView]

{% endhighlight %}

效果是这样的，看起来并没有什么问题

![](http://pchou.qiniudn.com/oc-statusbar-06.png)

然而如果我们把这个VC放到一个导航控制器中，同样的代码却是这样结果

![](http://pchou.qiniudn.com/oc-statusbar-07.png)

首先，看起来`UITextView`距离设备顶部的绝对距离似乎并没有变化，但是请注意`UITextView`的滚动条，滚动条竟然没有顶部对齐，而且文字也向下移位了，看起来空出一大块。仔细看空出的这段高度其实刚好是导航栏的高度64个点！！经过搜索，我发现只要设置如下代码即可恢复这种异常的状况：

{% highlight objectivec %}

self.automaticallyAdjustsScrollViewInsets = NO;

{% endhighlight %}

这下明白了，原来VC会对其内部的`UIScrollView`的内容部分进行一个`Inset`，这个`Inset`在上半部分刚好就对应导航栏的高度，而`UIScrollView`包括`UITableView`和`UITextView`等。到这里，似乎有些问题明朗了：

1. VC中的view默认会对`UIScrollView`做一个适应导航栏的处理，由此推测，其实只要是VC中的控件，都是从设备左上角的(0,0)开始算的，只是对于`UIScrollView`，VC会自动调整一下内容的位置而已。
2. 在有导航的情况下，可视范围的Y坐标就是从64开始的，除了`UIScrollView`的控件，定位的时候，都应当以(0,64)为原点；而`UIScrollView`如果是全屏的，那么无所谓，如果不是全屏的，请注意是否需要设置VC的`automaticallyAdjustsScrollViewInsets`。




参考资料

- [定制iOS 7中的导航栏和状态栏](http://www.tuicool.com/articles/IZFRJbN)
- [
iOS Programming 101: How to Customize Navigation Bar and Back Button](http://www.appcoda.com/customize-navigation-bar-back-butto/)
- [How to change Status Bar text color in iOS 7](http://stackoverflow.com/questions/17678881/how-to-change-status-bar-text-color-in-ios-7#comment28947732_17768797)
- [preferredStatusBarStyle isn't called](http://stackoverflow.com/questions/19022210/preferredstatusbarstyle-isnt-called/19513714#19513714)
- [Blank space at top of UITextView in iOS 7](http://stackoverflow.com/questions/18931934/blank-space-at-top-of-uitextview-in-ios-7)

