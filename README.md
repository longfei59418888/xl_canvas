# xl_canvas

<pre>
<code>

const canvas = new Canvas({
    canvas: 'test',
    target: 'test',
    list: 'list',
    height: 960,
    width: 960,
    before:..,
    after:..,
    data: dataCa?JSON.parse(dataCa):[],
});

</code>
</pre>

### options
##### canvas : canvas 对象或者选择器
##### target : 事件对象。
##### list : 图片列表对象
##### height/width : 宽高
##### data : 初始化数据
##### before : 初始化绘图之前
##### after : 初始化绘图之后
#
### canvas 实例对象方法
#####  addPhoto() : 添加图片，传入一个url/图片对象
#####  save() : 返回报错的数据
#####  addCommand(fuc) : 添加操作，对canvas的操作
