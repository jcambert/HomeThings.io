(function(angular,Raphael) {
  'use strict';
var percentColors = ["#a9d70b", "#f9c802", "#ff0000"];
function getStyle(doc,oElm, strCssRule)
{
	var strValue = "";
	if(doc.defaultView && doc.defaultView.getComputedStyle)
	{
		strValue = doc.defaultView.getComputedStyle(oElm, "").getPropertyValue(strCssRule);
	}
	else if(oElm.currentStyle)
	{
		strCssRule = strCssRule.replace(/\-(\w)/g, function(strMatch, p1)
		{
			return p1.toUpperCase();
		});
		strValue = oElm.currentStyle[strCssRule];
	}
	return strValue;
}

var ie = (function()
{

	var undef, v = 3, div = document.createElement('div'), all = div.getElementsByTagName('i');

	while(div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->', all[0]);

	return v > 4 ? v : undef;

}());

function onCreateElementNsReady(func,$timeout)
{
	if(document.createElementNS != undefined)
	{
		func();
	}
	else
	{
		$timeout(function()
		{
			onCreateElementNsReady(func,$timeout);
		}, 100);
	}
}

var getColorForPercentage = function(pct, col, grad)
{

	var no = col.length;
	if(no === 1) return col[0];
	var inc = (grad) ? (1 / (no - 1)) : (1 / no);
	var colors = new Array();
	for(var i = 0; i < col.length; i++)
	{
		var percentage = (grad) ? (inc * i) : (inc * (i + 1));
		var rval = parseInt((cutHex(col[i])).substring(0, 2), 16);
		var gval = parseInt((cutHex(col[i])).substring(2, 4), 16);
		var bval = parseInt((cutHex(col[i])).substring(4, 6), 16);
		colors[i] = { pct: percentage, color: { r: rval, g: gval, b: bval  } };
	}

	if(pct == 0) return 'rgb(' + [colors[0].color.r, colors[0].color.g, colors[0].color.b].join(',') + ')';
	for(var ii = 0; ii < colors.length; i++)
	{
		if(pct <= colors[ii].pct)
		{
			if(grad == true)
			{
				var lower = colors[ii - 1];
				var upper = colors[ii];
				var range = upper.pct - lower.pct;
				var rangePct = (pct - lower.pct) / range;
				var pctLower = 1 - rangePct;
				var pctUpper = rangePct;
				var color = {
					r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
					g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
					b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
				};
				return 'rgb(' + [color.r, color.g, color.b].join(',') + ')';
			}
			else
			{
				return 'rgb(' + [colors[ii].color.r, colors[ii].color.g, colors[ii].color.b].join(',') + ')';
			}
		}
	}
}
/*
function getRandomInt(min, max)
{
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
*/
function cutHex(str)
{
	return (str.charAt(0) == "#") ? str.substring(1, 7) : str
}


  angular
  .module('ngGauge',[])
  .directive('gauge',function($log,$document,$timeout){
      return{
          restrict:'E',
          replace:true,
          scope:{
              settings:'=settings',
              value:'=value'
          },
          template:'<div></div>',
          controller:function($scope){
            $scope.$watch('value',function(){
                //$log.log('Gauge value updated to:'+$scope.value);
                $scope.gauge.update($scope.value);
            });
          },
          link:function($scope,$element,attr){
            $log.log('create new gauge');
            $log.log($element);
            $scope.gauge=new Gauge($element,$scope.settings,$document,$timeout);
            
           
            
           // gauge.update($scope.value);
            //$scope.value=0;
          }
      }
  });
  
  var Gauge = function($element,$settings,$document,$timeout){
      
      this.document=$document;
      if(!$document.getElementById($element[0].id))
        {
            alert("No element with id: \"" + $element[0].id + "\" found!");
            return false;
        }
      this.config={
                  id: $element[0].id,
                  value :0,
                  valueFontColor:'#010101',
                  min:0,
                  max:100,
                  showMinMax:true,
                  gaugeWidthScale:1.0,
                  gaugeColor:'#edebeb',
                  label:"",
                  showInnerShadow:true,
                  shadowOpacity:0.2,
                  shadowSize:5,
                  shadowVerticalOffset:3,
                  levelColors:percentColors,
                  levelColorsGradient:true,
                  labelFontColor: "#b3b3b3",
                  startAnimationTime: 700,
                  startAnimationType: ">",
                  refreshAnimationTime : 700,
                  refreshAnimationType: ">"
              }
        angular.extend(this.config,$settings);     
        

        // overflow values
        if(this.config.value > this.config.max) this.config.value = this.config.max;
        if(this.config.value < this.config.min) this.config.value = this.config.min;
        
        this.originalValue = this.config.value;

        
        

        // canvas
        this.canvas = Raphael(this.config.id, "100%", "100%");

        // canvas dimensions
        //var canvasW = document.getElementById(this.config.id).clientWidth;
        //var canvasH = document.getElementById(this.config.id).clientHeight;
        var canvasW =Number( getStyle($document,$document.getElementById(this.config.id), "width").slice(0, -2)) * 1;
        var canvasH =Number( getStyle($document,$document.getElementById(this.config.id), "height").slice(0, -2)) * 1;

        // widget dimensions
        var widgetW, widgetH;
        if((canvasW / canvasH) > 1.25)
        {
            widgetW = 1.25 * canvasH;
            widgetH = canvasH;
        }
        else
        {
            widgetW = canvasW;
            widgetH = canvasW / 1.25;
        }

        // delta
        var dx = (canvasW - widgetW) / 2;
        var dy = (canvasH - widgetH) / 2;

        // value
        var valueFontSize = ((widgetH / 6.4) > 16) ? (widgetH / 6.4) : 16;
        var valueX = dx + widgetW / 2;
        var valueY = dy + widgetH / 1.4;

        // label
        var labelFontSize = ((widgetH / 16) > 10) ? (widgetH / 16) : 10;
        var labelX = dx + widgetW / 2;
        //var labelY = dy + widgetH / 1.126760563380282;
        var labelY = valueY + valueFontSize / 2 + 6;

        // min
        var minFontSize = ((widgetH / 16) > 10) ? (widgetH / 16) : 10;
        var minX = dx + (widgetW / 10) + (widgetW / 6.666666666666667 * this.config.gaugeWidthScale) / 2;
        var minY = dy + widgetH / 1.126760563380282;

        // max
        var maxFontSize = ((widgetH / 16) > 10) ? (widgetH / 16) : 10;
        var maxX = dx + widgetW - (widgetW / 10) - (widgetW / 6.666666666666667 * this.config.gaugeWidthScale) / 2;
        var maxY = dy + widgetH / 1.126760563380282;

        // parameters
        this.params = {
            canvasW      : canvasW,
            canvasH      : canvasH,
            widgetW      : widgetW,
            widgetH      : widgetH,
            dx           : dx,
            dy           : dy,
            valueFontSize: valueFontSize,
            valueX       : valueX,
            valueY       : valueY,
            labelFontSize: labelFontSize,
            labelX       : labelX,
            labelY       : labelY,
            minFontSize  : minFontSize,
            minX         : minX,
            minY         : minY,
            maxFontSize  : maxFontSize,
            maxX         : maxX,
            maxY         : maxY
        };

        // pki - custom attribute for generating gauge paths
        this.canvas.customAttributes.pki = function(value, min, max, w, h, dx, dy, gws)
        {

            var alpha = (1 - (value - min) / (max - min)) * Math.PI , Ro = w / 2 - w / 10, Ri = Ro - w / 6.666666666666667 * gws,

                Cx = w / 2 + dx, Cy = h / 1.25 + dy,

                Xo = w / 2 + dx + Ro * Math.cos(alpha), Yo = h - (h - Cy) + dy - Ro * Math.sin(alpha), Xi = w / 2 + dx + Ri * Math.cos(alpha), Yi = h - (h - Cy) + dy - Ri * Math.sin(alpha), path;

            path += "M" + (Cx - Ri) + "," + Cy + " ";
            path += "L" + (Cx - Ro) + "," + Cy + " ";
            path += "A" + Ro + "," + Ro + " 0 0,1 " + Xo + "," + Yo + " ";
            path += "L" + Xi + "," + Yi + " ";
            path += "A" + Ri + "," + Ri + " 0 0,0 " + (Cx - Ri) + "," + Cy + " ";
            path += "z ";
            return { path: path };
        }

        // gauge
        this.gauge = this.canvas.path().attr({
            "stroke": "none",
            "fill"  : this.config.gaugeColor,
            pki     : [this.config.max, this.config.min, this.config.max, this.params.widgetW, this.params.widgetH,
                    this.params.dx, this.params.dy, this.config.gaugeWidthScale]
        });
        this.gauge.id = this.config.id + "-gauge";

        // level
        this.level = this.canvas.path().attr({
            "stroke": "none",
            "fill"  : getColorForPercentage((this.config.value - this.config.min) / (this.config.max - this.config.min), this.config.levelColors, this.config.levelColorsGradient),
            pki     : [this.config.min, this.config.min, this.config.max, this.params.widgetW, this.params.widgetH,
                    this.params.dx, this.params.dy, this.config.gaugeWidthScale]
        });
        this.level.id = this.config.id + "-level";

        // value
        this.txtValue = this.canvas.text(this.params.valueX, this.params.valueY, this.originalValue);
        this.txtValue.attr({
            "font-size"   : this.params.valueFontSize,
            "font-weight" : "bold",
            "font-family" : "Arial",
            "fill"        : this.config.valueFontColor,
            "fill-opacity": "0"
        });
        this.txtValue.id = this.config.id + "-txtvalue";

        // label
        this.txtLabel = this.canvas.text(this.params.labelX, this.params.labelY, this.config.label);
        this.txtLabel.attr({
            "font-size"   : this.params.labelFontSize,
            "font-weight" : "normal",
            "font-family" : "Arial",
            "fill"        : this.config.labelFontColor,
            "fill-opacity": "0"
        });
        this.txtLabel.id = this.config.id + "-txtlabel";

        // min
        this.txtMin = this.canvas.text(this.params.minX, this.params.minY, this.config.min);
        this.txtMin.attr({
            "font-size"   : this.params.minFontSize,
            "font-weight" : "normal",
            "font-family" : "Arial",
            "fill"        : this.config.labelFontColor,
            "fill-opacity": (this.config.showMinMax == true) ? "1" : "0"
        });
        this.txtMin.id = this.config.id + "-txtmin";

        // max
        this.txtMax = this.canvas.text(this.params.maxX, this.params.maxY, this.config.max);
        this.txtMax.attr({
            "font-size"   : this.params.maxFontSize,
            "font-weight" : "normal",
            "font-family" : "Arial",
            "fill"        : this.config.labelFontColor,
            "fill-opacity": (this.config.showMinMax == true) ? "1" : "0"
        });
        this.txtMax.id = this.config.id + "-txtmax";

        var defs = this.canvas.canvas.childNodes[1];
        var svg = "http://www.w3.org/2000/svg";


        if(ie < 9)
        {
            onCreateElementNsReady(function()
            {
                this.generateShadow();
            },$timeout);
        }
        else
        {
            this.generateShadow(svg, defs);
        }

        // animate
        this.level.animate({pki: [this.config.value, this.config.min, this.config.max, this.params.widgetW,
                                this.params.widgetH, this.params.dx, this.params.dy, this.config.gaugeWidthScale
        ]}, this.config.startAnimationTime, this.config.startAnimationType);

        this.txtValue.animate({"fill-opacity": "1"}, this.config.startAnimationTime, this.config.startAnimationType);
        this.txtLabel.animate({"fill-opacity": "1"}, this.config.startAnimationTime, this.config.startAnimationType);
  };
  // refresh gauge level
Gauge.prototype.update = function(val)
{
	// overflow values
	var originalVal = val;
	if(val > this.config.max)
	{
		val = this.config.max;
	}
	if(val < this.config.min)
	{
		val = this.config.min;
	}

	var color = getColorForPercentage((val - this.config.min) / (this.config.max - this.config.min), this.config.levelColors, this.config.levelColorsGradient);
	this.canvas.getById(this.config.id + "-txtvalue").attr({"text": originalVal});
	this.canvas.getById(this.config.id + "-level").animate({pki                                       : [val,
	                                                                                                     this.config.min,
	                                                                                                     this.config.max,
	                                                                                                     this.params.widgetW,
	                                                                                                     this.params.widgetH,
	                                                                                                     this.params.dx,
	                                                                                                     this.params.dy,
	                                                                                                     this.config.gaugeWidthScale
	], "fill"                                                                                         : color}, this.config.refreshAnimationTime, this.config.refreshAnimationType);
};
Gauge.prototype.generateShadow = function(svg, defs){
	// FILTER
	var gaussFilter = this.document.createElementNS(svg, "filter");
	gaussFilter.setAttribute("id", this.config.id + "-inner-shadow");
	defs.appendChild(gaussFilter);

	// offset
	var feOffset = this.document.createElementNS(svg, "feOffset");
	feOffset.setAttribute("dx", 0);
	feOffset.setAttribute("dy", this.config.shadowVerticalOffset);
	gaussFilter.appendChild(feOffset);

	// blur
	var feGaussianBlur = this.document.createElementNS(svg, "feGaussianBlur");
	feGaussianBlur.setAttribute("result", "offset-blur");
	feGaussianBlur.setAttribute("stdDeviation", this.config.shadowSize);
	gaussFilter.appendChild(feGaussianBlur);

	// composite 1
	var feComposite1 = this.document.createElementNS(svg, "feComposite");
	feComposite1.setAttribute("operator", "out");
	feComposite1.setAttribute("in", "SourceGraphic");
	feComposite1.setAttribute("in2", "offset-blur");
	feComposite1.setAttribute("result", "inverse");
	gaussFilter.appendChild(feComposite1);

	// flood
	var feFlood = this.document.createElementNS(svg, "feFlood");
	feFlood.setAttribute("flood-color", "black");
	feFlood.setAttribute("flood-opacity", this.config.shadowOpacity);
	feFlood.setAttribute("result", "color");
	gaussFilter.appendChild(feFlood);

	// composite 2
	var feComposite2 = this.document.createElementNS(svg, "feComposite");
	feComposite2.setAttribute("operator", "in");
	feComposite2.setAttribute("in", "color");
	feComposite2.setAttribute("in2", "inverse");
	feComposite2.setAttribute("result", "shadow");
	gaussFilter.appendChild(feComposite2);

	// composite 3
	var feComposite3 = this.document.createElementNS(svg, "feComposite");
	feComposite3.setAttribute("operator", "over");
	feComposite3.setAttribute("in", "shadow");
	feComposite3.setAttribute("in2", "SourceGraphic");
	gaussFilter.appendChild(feComposite3);

	// set shadow
	if(this.config.showInnerShadow == true)
	{
		this.canvas.canvas.childNodes[2].setAttribute("filter", "url(#" + this.config.id + "-inner-shadow)");
		this.canvas.canvas.childNodes[3].setAttribute("filter", "url(#" + this.config.id + "-inner-shadow)");
	}
}
  
  })(angular,Raphael);