(function(global,doc,utils_factory){
	var utils = utils_factory(global,doc);
	var activeIframe;
	/**
	 * 转换href相对地址
	 *	如 '../../blog/cssSkill.html','blog/cssSkill.html'
	 **/
	function hrefToAbsolute(src,base_path){
		/**
		 * 若包含域名
		 *	http://
		 *	https://
		 *	//
		 */
		if(src.match(/^(\w+\:)*\/\//)){
			src = src.replace(/^(\w+\:)*\/\/[^\/]*/,'');
		}
		//src: /blog/cssSkill.html
		if(src.charAt(0) == "/"){
			return src;
		}
		
		base_path = /^[^?#]*\//.exec(base_path)[0];
		//src: '../../blog/cssSkill.html'
		if(src.match(/^\.\.\//)){
			src = src.replace(/\.\.\//g,function(){
				//每匹配到一个“../”，base_path向前退一位
				base_path = base_path.replace(/\/[^\/]*\/$/,'/');
				return '';
			});
		}
		return base_path + src; 
	} 
	function createNewPage(url){
		var iframe = document.createElement('iframe'); 
		var oldIframe = activeIframe;
		activeIframe = iframe;
		iframe.src= url;
		if(oldIframe){
			utils.fadeOut(oldIframe,100,function(){
				//移除老的iframe
				utils.removeNode(oldIframe);
				document.body.appendChild(iframe);
				utils.fadeIn(iframe,500);
			});
		}else{
			document.body.appendChild(iframe);
		//	utils.fadeIn(iframe,500);
		}
		utils.bind(iframe,'load',function(){
			utils.bind(iframe.contentWindow.document,'click','.spa-link',function(evt){
				var href = this.getAttribute('href');
				var url = hrefToAbsolute(href,iframe.contentWindow.location.pathname);
				if(url.length < 1){
					return
				}
				pushHash(url);
				var evt = evt || iframe.contentWindow.event; 
				if (evt.preventDefault) { 
					evt.preventDefault(); 
				} else { 
					evt.returnValue = false; 
				}
			});
			utils.bind(iframe.contentWindow.document,'mousedown','a',function(evt){
				var target = this.getAttribute('target');
				if(!target){
					this.setAttribute('target','_blank');
				}
			});
		});
	}
	function pushHash(url){
		this.url = url;
		window.location.hash = '!' + url;
	}
	utils.onhashchange(function(url){
		createNewPage(url)
	});
})(window,document,function (window,document) {
	/**
	 * 判断对象类型
	 * string number array
	 * object function 
	 * htmldocument
	 * undefined null
	 */
	function TypeOf(obj) {
		return Object.prototype.toString.call(obj).match(/\s(\w+)/)[1].toLowerCase();
	}
	
	/**
	 * 检测是否为数字
	 * 兼容字符类数字 '23'
	 */
	function isNum(ipt){
		return (ipt !== '') && (ipt == +ipt) ? true : false;
	}
	
	/**
 	 * 遍历数组或对象
	 * 
	 */
	function each(arr,fn){
		//检测输入的值
		if(typeof(arr) != 'object' || typeof(fn) != 'function'){
			return;
		}
		var Length = arr.length;
		if( isNum(Length) ){
			for(var i=0;i<Length;i++){
				if(fn.call(this,i,arr[i]) === false){
					break
				}
			}
		}else{
			for(var i in arr){
				if (!arr.hasOwnProperty(i)){
					continue;
				}
				if(fn.call(this,i,arr[i]) === false){
					break
				}
			}
		}
	}
	
	/**
	 * 对象拷贝
	 *
	 */
	function clone(fromObj,toObj){
		each(fromObj,function(i,item){
			if(typeof item == "object"){   
				toObj[i] = item.constructor==Array ? [] : {};
				
				clone(item,toObj[i]);
			}else{
				toObj[i] = item;
			}
		});
		
		return toObj;
	}	
	/**
	 * 判断是否支持css属性
	 * 兼容css3
	 */
	var supports = (function() {
		var styles = document.createElement('div').style,
			vendors = 'Webkit Khtml Ms O Moz'.split(/\s/);
		
		return function(prop) {
			var returns = false;
			if ( prop in styles ){
				returns = prop;
			}else{
				prop = prop.replace(/^[a-z]/, function(val) {
					return val.toUpperCase();
				});
				each(vendors,function(i,value){
					if ( value + prop in styles ) {
						returns = ('-' + value + '-' + prop).toLowerCase();
					}
				});
			}
			return returns;
		};
	})();
	
	
	var private_css3 = (supports('transition') && supports('transform')) ? true : false;
	
	/**
	 * 判断dom是否拥有某个class
	 */
	function hasClass(dom,classSingle){
		return dom.className && dom.className.match(new RegExp('(\\s|^)' + classSingle + '(\\s|$)')) || false;
	}
	
	//获取样式
	function getStyle(elem, prop) {
		var value;
		prop == "borderWidth" ? prop = "borderLeftWidth" : prop;
		if (elem.style[prop]){
			value = elem.style[prop];
		} else if(document.defaultView) {
			var style = document.defaultView.getComputedStyle(elem, null);
			value = prop in style ? style[prop] : style.getPropertyValue(prop);
		} else if (elem.currentStyle) {
			value = elem.currentStyle[prop];
		}
		
		
		if (/\px$/.test(value)){
			value = parseInt(value);
		}else if (isNum(value) ){
			value = Number(value);
		} else if(value == '' || value == 'medium'){
			value = 0;
		} else if (value == 'auto'){
			if(prop == 'height'){
				value = elem.clientHeight;
			}else if(prop == 'width'){
				value = elem.clientWidth;
			}
		}
		
		return value;
	}
	

	/**
	 * dom设置样式
	 */
	function setStyle(elem,prop,value){
		prop = prop.toString();
		if (prop == "opacity") {
			elem.style.filter = 'alpha(opacity=' + (value * 100)+ ')';
			value = value;
		} else if ( isNum(value) && prop != 'zIndex'){
			value = value + "px";
		}
		elem.style[prop] = value;
	}
	//设置css
	function setCss(doms,cssObj){
		doms = [].concat(doms);
		
		/**
		 * 为css3属性增加扩展
		 */
		each(cssObj,function(key,value){
			if(key == 'transform' || key == 'transition'){
				each(['webkit','o','moz'],function(i,text){
					cssObj['-' + text + '-' + key] = value
				});
			}
		});
		each(doms,function(i,dom){
			each(cssObj,function(key,value){
				setStyle(dom,key,value);
			});
		});
	}
	
	/**
	 * css3动画
	 * 内部类，不检测参数
	 */
	function css3_anim(elem,cssObj,durtime,animType,onEnd){
		//记录初始transition值
		var transition_start = getStyle(elem,'transition');
		var cssSet = clone(cssObj,{
			'transition' : durtime + 'ms ' + animType
		});
		
		//开启3d加速
		if(!cssSet.transform){
			cssSet.transform = 'translate3d(0, 0, 0)';
		}else if(!cssSet.transform.match('translate3d')){
			cssSet.transform = cssSet.transform + ' translate3d(0, 0, 0)';
		}
		/**
		 * 动画结束回调
		 */
		function endFn(){
			endFn = null;
			elem.removeEventListener("webkitTransitionEnd",transitionFn, true);
			//还原transition值
			setCss(elem,{
				'transition' : transition_start || 'all 0s'
			});
			onEnd && onEnd.call(elem);
		}
		
		/**
		 * 高大上的webkitTransitionEnd
		 *   动画过程中，在每一帧持续触发
		 */
		var delay;
		function transitionFn(){
			clearTimeout(delay);
			delay = setTimeout(function(){
				endFn && endFn();
			},40);
		}
		elem.addEventListener("webkitTransitionEnd",transitionFn, true);
		
		/**
		 * 加一份保险
		 *   解决 css无变化时webkitTransitionEnd事件不会被触发的问题
		 */
		setTimeout(function(){
			endFn && endFn();
		},durtime + 80);
		
		/**
		 * 不知道为啥，若刚设置完css再修改同一属性，firefox下没效果
		 *   可能是浏览器优化css动画的逻辑
		 *	 故加定时器解决此bug
		 */
		setTimeout(function(){
			setCss(elem,cssSet);
		},10);
	}
	/**
	 * css3动画
	 * @param elem dom对象
	 * @param cssObj 动画对象
	 * @param durtime 持续时间
	 * @param [animType] 缓动类型
	 * @param [callback] 回调
	 */
	function animation(elem,cssObj,durtime,a,b) {
        var animType = "linear",
			onEnd = null;
		
		if (arguments.length < 3) {
			throw new Error("missing arguments [dom,cssObj,durtime]");
		} else {
			if (TypeOf(a) == "function") {
				onEnd = a;
			}else if (typeof (a) == "string") {
				animType = a;
			}
			
			if (TypeOf(b) == "function") {
				onEnd = b;
			}
		}
		if(private_css3){
			return css3_anim(elem,cssObj,durtime,animType,onEnd);
		}else{
			setCss(elem,cssObj);
			onEnd && onEnd.call(elem);
		}
	}
	
	/**
	 * 事件绑定
	 * elem:节点
	 * type:事件类型
	 * handler:回调
	 */
    var bindHandler = (function() {
		// 标准浏览器
		if (window.addEventListener) {
			return function(elem, type, handler) {
				elem.addEventListener(type, handler, false);
			}
		} else if (window.attachEvent) {
			// IE浏览器
			return function(elem, type, handler) {
				elem.attachEvent("on" + type, handler);
			}
		}
	})();

	/**
	 * 事件解除
	 * elem:节点
	 * type:事件类型
	 * handler:回调
	 */
	var removeHandler = (function() {
		// 标准浏览器
		if (window.removeEventListener) {
			return function(elem, type, handler) {
				elem.removeEventListener(type, handler, false);
			}
		} else if (window.detachEvent) {
			// IE浏览器
			return function(elem, type, handler) {
				elem.detachEvent("on" + type, handler);
			}
		}
	})();
	
	function checkEventForClass(event,classStr,dom){
		var target = event.srcElement || event.target;
		while (1) {
			if(target == dom || !target){
				return false;
			}
			if(hasClass(target,classStr)){
				return target;
			}
			
			target = target.parentNode;
		}
	}
	function checkEventForTagname(event,tagName,dom){
		var target = event.srcElement || event.target;
		while (1) {
			if(target == dom || !target){
				return false;
			}
			if(target.tagName.toLocaleLowerCase() == tagName){
				return target;
			}
			
			target = target.parentNode;
		}
	}
	function bind(elem, type,a,b){
		var className,tagName,fn;
		if(typeof(a) == 'string'){
			fn = b;
			if(a[0] == '.'){
				className = a.replace(/^\./,'');
				callback = function(e){
					var bingoDom = checkEventForClass(e,className,elem);
					if(bingoDom){
						fn && fn.call(bingoDom,e);
					}
				};
			}else{
				tagName = a;
				callback = function(e){
					var bingoDom = checkEventForTagname(e,tagName,elem);
					if(bingoDom){
						fn && fn.call(bingoDom,e);
					}
				};
			}
		}else{
			callback = a;
		}
		bindHandler(elem,type,callback);
	}
	
    return {
		TypeOf : TypeOf,
		isNum : isNum,
		each : each,
		getStyle : getStyle,
		css : setCss,
		animation : animation,
		supports : supports,
		bind : bind,
		clone : clone,
		unbind : removeHandler,
		hasClass : hasClass,
		'addClass' : function (dom, cls) {
			if (!this.hasClass(dom, cls)) dom.className += " " + cls;
		},
		'removeClass' : function (dom, cls) {
			if (hasClass(dom, cls)) {
				var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
				dom.className = dom.className.replace(reg, ' ');
			}
		},
		/**
		 * 页面加载
		 */
		ready : (function(){
			var readyFns = [];
			function completed() {
				removeHandler(document,"DOMContentLoaded", completed);
				removeHandler(window,"load", completed);
				each(readyFns,function(i,fn){
					fn();
				});
				readyFns = null;
			}
			return function (callback){
				if ( document.readyState === "complete" ) {
					callback && callback();
				} else {
					callback && readyFns.push(callback);
					
					bindHandler(document,'DOMContentLoaded',completed);
					bindHandler(window,'load',completed);
				}
			}
		})(),
		//创建dom
		createDom : function (html){
			var a = document.createElement('div');
			a.innerHTML = html;
			return a.childNodes;
		},
		//在指定DOM后插入新DOM
		insertAfter : function (newElement, targetElement){
			var parent = targetElement.parentNode;
			if (parent.lastChild == targetElement) {
				//如果最后的节点是目标元素，则直接追加
				parent.appendChild(newElement);
			} else {
				//插入到目标元素的下一个兄弟节点之前
				parent.insertBefore(newElement, targetElement.nextSibling);
			}
		},
		//移除dom节点
		removeNode : function (elem){  
			if(elem && elem.parentNode && elem.tagName != 'BODY'){  
				elem.parentNode.removeChild(elem);  
			}  
		},
		//根据class查找元素
		findByClassName : (function(){
			if(typeof(document.getElementsByClassName) !== 'undefined'){
				//支持gEbCN
				return function (dom,classStr){
					return dom.getElementsByClassName(classStr);
				};
			}else{
				//无奈采用遍历法
				return function (dom,classStr){
					var returns = [];
					//尝试获取所有元素
					var caches = dom.getElementsByTagName("*");
					//遍历结果
					each(caches,function(i,thisDom){
						//检查class是否合法
						if(hasClass(thisDom,classStr)){
							returns.push(thisDom);
						}
					});
					return returns;
				};
			}
		})(),
		//淡入
		fadeIn : function (DOM,time,fn){
			var op = getStyle(DOM,'opacity');
			setCss(DOM,{
				'opacity' : 0,
				'display' : 'block'
			});
			animation(DOM,{
				'opacity' : op
			}, time, function(){
				fn && fn.call(DOM);
			});
		},
		//淡出
		fadeOut : function (DOM,time,fn){
			var op = getStyle(DOM,'opacity');
			animation(DOM,{
				'opacity' : 0
			}, time,function(){
				DOM.style.opacity = op;
				DOM.style.display = 'none';
				fn && fn.call(DOM);
			});
		},
		onhashchange : (function(){
			var hashchange = 'hashchange',
				documentMode = document.documentMode,
				supportHashChange = ('on' + hashchange in window) && ( documentMode === void 0 || documentMode > 7 );
			//获取最新的hash
			function getHash(hashStr){
				return (hashStr || window.location.hash || '#!').replace(/^#!/,'')
			}
			if(supportHashChange){
				return function(callback){
					window.onhashchange = function(e){
						callback && callback(getHash());
					}
					callback(getHash());
				}
			}else{
				return function (callback){
					//记录hash值
					var private_oldHash = window.location.hash;
					setInterval(function(){
						var new_hash = window.location.hash || '#';
						//hash发生变化
						if(new_hash != private_oldHash){
							private_oldHash = new_hash;
							callback && callback(getHash(new_hash));
						}
					},50);
					callback(getHash());
				}
			}
		})()
	};
});