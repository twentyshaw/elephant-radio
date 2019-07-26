var EventCenter = { //创建一个事件中，来监听和触发事件
	on: function(type,handler){ //监听事件 type：事件名，handler：监听函数
		$(document).on(type,handler)
	},

	fire: function(type,data){ //触发事件： type:事件名，data：传递给该事件的监听函数的参数
		$(document).trigger(type, data)
	}
}

var Footer = {
	init: function(){ //初始化事件
		this.$footer = $('footer')
		this.$ul = this.$footer.find("ul")
		this.$box = this.$footer.find(".box")
		this.$leftBtn = this.$footer.find(".icon-left")
		this.$rightBtn = this.$footer.find(".icon-right")
		this.isToEnd = false
		this.isToStart = true
		this.isAnimate = false
		this.bind()
		this.render()
	},

	bind:function(){ //所有要绑定的事件都放在这里
		var _this = this
		this.$rightBtn.on("click",function(){
			if (_this.isAnimate) return
			var itemWidth = _this.$box.find("li").outerWidth(true)
			var rowCount = Math.floor(_this.$box.width() / itemWidth)
			if (!_this.isToEnd) {
				_this.isAnimate = true
				_this.$ul.animate({
					left: "-=" + itemWidth * rowCount
				},400,function(){
					_this.isAnimate = false
					_this.isToStart = false
					if (parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css("left")) >= parseFloat(_this.$ul.width())){
						_this.isToEnd = true
					}
				})
			}
			
		})
		this.$leftBtn.on("click",function(){
			if (_this.isAnimate) return
			var itemWidth = _this.$box.find("li").outerWidth(true)
			var rowCount = Math.floor(_this.$box.width() / itemWidth)
			if (!_this.isToStart) {
				_this.isAnimate = true
				_this.$ul.animate({
					left: "+=" + itemWidth * rowCount
				},400,function(){
					_this.isAnimate = false
					_this.isToEnd = false
					if (parseFloat(_this.$ul.css("left")) >= 0) {
						_this.isToStart = true
					}
				})
			}
			
		})

		this.$footer.on("click","li",function(){ //对于 li 的绑定，不能直接写成 li.on()，要写成这种形式，因为li一开始是不存在的
			$(this).addClass("active")
			 .siblings().removeClass("active")
			EventCenter.fire("select-album",{
				channelId:$(this).attr("data-channel-id"),
				channelName:$(this).attr("data-channel-name")
			})
		})
	},

	render: function(){ //渲染页面的函数都放在这里
		var _this = this
		$.getJSON('//jirenguapi.applinzi.com/fm/getChannels.php')//调用这个接口，获取数据
		  .done(function(ret){//成功之后，拿到数据对数据进行操作
		  	console.log(ret)
		  	_this.renderFooter(ret.channels)
		  }).fail(function(){
		  	console.log("error")
		  })
	},

	renderFooter(channels){
		console.log(channels)
		var html = "" //定义一个空对象，然后遍历channels,把每一个channel都渲染成一个li,放到html这个对象里面
		channels.forEach(function(channel){
			html += "<li data-channel-id =" + channel.channel_id + " data-channel-name =" + channel.name  + ">" //自定义属性data-channel-id 用来存放channel_id 注意两个自定义属性间要有空格
			        +"<div class='cover' style='background-image:url(" + channel.cover_small +")'></div>"
					+"<h3>" + channel.name + "</h3>"
					+"</li>"
		})
		this.$ul.html(html) //然后把html放到 html文件的 ul 里
		this.setStyle()
	},

	setStyle(){
		var count = this.$footer.find("li").length
		var width = this.$footer.find("li").outerWidth(true)
		this.$ul.css({
			width: width * count + "px"
		})

	}
}

var Fm = {
	init: function(){
		this.$container = $("#page-music")
		this.audio = new Audio()
		this.audio.autoplay = true
		this.$playBtn = $(".btn-play")
		this.bind()
	},

	bind: function(){
		var _this = this
		EventCenter.on("select-album", function(e, options){
			_this.channelId = options.channelId
			_this.channelName = options.channelName
			_this.loadMusic()

		})

		this.$playBtn.on("click",function(){
			var $btn = $(this)
			if ($btn.hasClass("icon-play")){
				$btn.removeClass("icon-play").addClass("icon-pause")
				_this.audio.play()
			}else{
				$btn.removeClass("icon-pause").addClass("icon-play")
				_this.audio.pause()
			}
		})

		this.$container.find(".btn-next").on("click",function(){
			_this.loadMusic()
		})

		this.audio.addEventListener("play",function(){
			clearInterval(_this.statusClock)
			_this.statusClock = setInterval(function(){
				_this.updateStatus()
			}, 1000)
			console.log("play")
		})
		this.audio.addEventListener("pause",function(){
			clearInterval(_this.statusClock)
			console.log("pause")
		})
	},

	loadMusic(){
		var _this = this
		console.log("loading")
		$.getJSON("//jirenguapi.applinzi.com/fm/getSong.php",{channel:this.channelId})
		 .done(function(ret){
		 	_this.song = ret.song[0]
		 	console.log(ret.song[0])
		 	_this.setMusic()
		 	_this.loadLyric()
		 })
	},

	loadLyric(){
		var _this = this
		console.log("loading")
		$.getJSON("//jirenguapi.applinzi.com/fm/getLyric.php",{sid:_this.song.sid})
		 .done(function(ret){
		 	var lyric = ret.lyric
		 	var lyricObj = {}
		 	lyric.split("\n").forEach(function(line){
		 		var times = line.match(/\d{2}:\d{2}/g)
		 		var str = line.replace(/\[.+?\]/g, "")
		 		if(Array.isArray(times)){times.forEach(function(time){
		 			lyricObj[time] = str
		 		})}
		 	})
		 	_this.lyricObj = lyricObj
		 })
	},

	setMusic(){
		if (this.$playBtn.hasClass("icon-play")){
				this.$playBtn.removeClass("icon-play").addClass("icon-pause")
		}
		this.$container.find(".lyric p").text("")
		this.$container.find(".current-time").text("0:00")
		this.$container.find(".bar-progress").css("width",0)

		this.audio.src = this.song.url
		$(".bg").css("background-image","url("+this.song.picture+")")
		this.$container.find(".album").css("background-image","url("+this.song.picture+")")
		this.$container.find(".detail h1").text(this.song.title)
		this.$container.find(".tag").text(this.channelName)
		this.$container.find(".author").text(this.song.artist)
	},

	updateStatus(){
		var min = Math.floor(this.audio.currentTime / 60)
		var second = Math.floor(this.audio.currentTime % 60) + ""
		var sec = second.length === 2?second:"0"+second
		this.$container.find(".current-time").text(min+":"+sec)
		this.$container.find(".bar-progress").css("width",this.audio.currentTime/this.audio.duration*100+"%")
		var line = this.lyricObj["0"+min+":"+sec]
		if (line) {
			this.$container.find(".lyric p").text(line)
		}
	}	
}

Footer.init()
Fm.init()