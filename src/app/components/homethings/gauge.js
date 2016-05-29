(function(angular,Raphael) {
  'use strict';
var percentColors = ["#a9d70b", "#f9c802", "#ff0000"];
function getStyle(oElm, strCssRule)
{
	var strValue = "";
	if(document.defaultView && document.defaultView.getComputedStyle)
	{
		strValue = document.defaultView.getComputedStyle(oElm, "").getPropertyValue(strCssRule);
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

function onCreateElementNsReady(func)
{
	if(document.createElementNS != undefined)
	{
		func();
	}
	else
	{
		setTimeout(function()
		{
			onCreateElementNsReady(func);
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
	for(var i = 0; i < colors.length; i++)
	{
		if(pct <= colors[i].pct)
		{
			if(grad == true)
			{
				var lower = colors[i - 1];
				var upper = colors[i];
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
				return 'rgb(' + [colors[i].color.r, colors[i].color.g, colors[i].color.b].join(',') + ')';
			}
		}
	}
}

function getRandomInt(min, max)
{
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function cutHex(str)
{
	return (str.charAt(0) == "#") ? str.substring(1, 7) : str
}


  angular
  .module('ngGauge',[])
  .directive('gauge',function($log){
      return{
          restrict:'E',
          replace:true,
          /*scope:{
              settings:'=',
              value:'='
          },*/
          template:'<div></div>',
          link:function($scope,$element,attr){
            $log.log('create new gauge');
            var gauge=new Gauge($element,$scope.settings);
            
            $scope.$watch('value',function(){
                $log.log('Gauge value aupdated to:'+$scope.value);
                gauge.update($scope.value);
            });
            
            gauge.update($scope.value);
            $scope.value=50;
          }
      }
  });
  
  var Gauge = function($element,$settings){
      this.settings={
                  element: $element[0].id,
                 
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
              
             angular.extend(this.settings,$settings);
              
              // radius is caluculated from element's width
            var radius = angular.element('#' + this.settings.element).width();
            
            this.paper = new Raphael(this.settings.element, radius, radius);
            
            var paperW = Number( getStyle(document.getElementById(this.settings.element), "width").slice(0, -2)) * 1;
            var paperH = Number( getStyle(document.getElementById(this.settings.element), "height").slice(0, -2)) * 1;
            
            
            var widgetW, widgetH;
            if((paperW / paperH) > 1.25)
            {
                widgetW = 1.25 * paperH;
                widgetH = paperH;
            }
            else
            {
                widgetW = paperW;
                widgetH = paperW / 1.25;
            }
            // delta
            var dx = (paperW - widgetW) / 2;
            var dy = (paperH - widgetH) / 2;

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
            var minX = dx + (widgetW / 10) + (widgetW / 6.666666666666667 * this.settings.gaugeWidthScale) / 2;
            var minY = dy + widgetH / 1.126760563380282;

            // max
            var maxFontSize = ((widgetH / 16) > 10) ? (widgetH / 16) : 10;
            var maxX = dx + widgetW - (widgetW / 10) - (widgetW / 6.666666666666667 * this.settings.gaugeWidthScale) / 2;
            var maxY = dy + widgetH / 1.126760563380282;
            
            this.params = {
                canvasW      : paperW,
                canvasH      : paperH,
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
            this.update = function(value){
                // pki - custom attribute for generating gauge paths
                this.paper.customAttributes.pki = function(value, min, max, w, h, dx, dy, gws)
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
                this.gauge = this.paper.path().attr({
                    "stroke": "none",
                    "fill"  : this.settings.gaugeColor,
                    pki     : [this.settings.max, this.settings.min, this.settings.max, this.params.widgetW, this.params.widgetH,
                            this.params.dx, this.params.dy, this.settings.gaugeWidthScale]
                });
                this.gauge.id = this.settings.id + "-gauge";

                // level
                this.level = this.paper.path().attr({
                    "stroke": "none",
                    "fill"  : getColorForPercentage((value - this.settings.min) / (this.settings.max - this.settings.min), this.settings.levelColors, this.settings.levelColorsGradient),
                    pki     : [this.settings.min, this.settings.min, this.settings.max, this.params.widgetW, this.params.widgetH,
                            this.params.dx, this.params.dy, this.settings.gaugeWidthScale]
                });
                this.level.id = this.settings.id + "-level";

                // value
                
                this.txtValue = this.paper.text(this.params.valueX, this.params.valueY, value);
                this.txtValue.attr({
                    "font-size"   : this.params.valueFontSize,
                    "font-weight" : "bold",
                    "font-family" : "Arial",
                    "fill"        : this.settings.valueFontColor,
                    "fill-opacity": "0"
                });
                this.txtValue.id = this.settings.id + "-txtvalue";

                // label
                this.txtLabel = this.paper.text(this.params.labelX, this.params.labelY, this.settings.label);
                this.txtLabel.attr({
                    "font-size"   : this.params.labelFontSize,
                    "font-weight" : "normal",
                    "font-family" : "Arial",
                    "fill"        : this.settings.labelFontColor,
                    "fill-opacity": "0"
                });
                this.txtLabel.id = this.settings.id + "-txtlabel";

                // min
                this.txtMin = this.paper.text(this.params.minX, this.params.minY, this.settings.min);
                this.txtMin.attr({
                    "font-size"   : this.params.minFontSize,
                    "font-weight" : "normal",
                    "font-family" : "Arial",
                    "fill"        : this.settings.labelFontColor,
                    "fill-opacity": (this.settings.showMinMax == true) ? "1" : "0"
                });
                this.txtMin.id = this.settings.id + "-txtmin";

                // max
                this.txtMax = this.paper.text(this.params.maxX, this.params.maxY, this.settings.max);
                this.txtMax.attr({
                    "font-size"   : this.params.maxFontSize,
                    "font-weight" : "normal",
                    "font-family" : "Arial",
                    "fill"        : this.settings.labelFontColor,
                    "fill-opacity": (this.settings.showMinMax == true) ? "1" : "0"
                });
                this.txtMax.id = this.settings.id + "-txtmax";

                var defs = this.paper.canvas.childNodes[1];
                var svg = "http://www.w3.org/2000/svg";


                if(ie < 9)
                {
                    onCreateElementNsReady(function()
                    {
                        this.generateShadow();
                    });
                }
                else
                {
                    this.generateShadow(svg, defs);
                }

                // animate
                this.level.animate({pki: [value, this.settings.min, this.settings.max, this.params.widgetW,
                                        this.params.widgetH, this.params.dx, this.params.dy, this.settings.gaugeWidthScale
                ]}, this.settings.startAnimationTime, this.settings.startAnimationType);

                this.txtValue.animate({"fill-opacity": "1"}, this.settings.startAnimationTime, this.settings.startAnimationType);
                this.txtLabel.animate({"fill-opacity": "1"}, this.settings.startAnimationTime, this.settings.startAnimationType);
            
         }
  };
  
Gauge.prototype.generateShadow = function(svg, defs){
	// FILTER
	var gaussFilter = document.createElementNS(svg, "filter");
	gaussFilter.setAttribute("id", this.settings.id + "-inner-shadow");
	defs.appendChild(gaussFilter);

	// offset
	var feOffset = document.createElementNS(svg, "feOffset");
	feOffset.setAttribute("dx", 0);
	feOffset.setAttribute("dy", this.settings.shadowVerticalOffset);
	gaussFilter.appendChild(feOffset);

	// blur
	var feGaussianBlur = document.createElementNS(svg, "feGaussianBlur");
	feGaussianBlur.setAttribute("result", "offset-blur");
	feGaussianBlur.setAttribute("stdDeviation", this.settings.shadowSize);
	gaussFilter.appendChild(feGaussianBlur);

	// composite 1
	var feComposite1 = document.createElementNS(svg, "feComposite");
	feComposite1.setAttribute("operator", "out");
	feComposite1.setAttribute("in", "SourceGraphic");
	feComposite1.setAttribute("in2", "offset-blur");
	feComposite1.setAttribute("result", "inverse");
	gaussFilter.appendChild(feComposite1);

	// flood
	var feFlood = document.createElementNS(svg, "feFlood");
	feFlood.setAttribute("flood-color", "black");
	feFlood.setAttribute("flood-opacity", this.settings.shadowOpacity);
	feFlood.setAttribute("result", "color");
	gaussFilter.appendChild(feFlood);

	// composite 2
	var feComposite2 = document.createElementNS(svg, "feComposite");
	feComposite2.setAttribute("operator", "in");
	feComposite2.setAttribute("in", "color");
	feComposite2.setAttribute("in2", "inverse");
	feComposite2.setAttribute("result", "shadow");
	gaussFilter.appendChild(feComposite2);

	// composite 3
	var feComposite3 = document.createElementNS(svg, "feComposite");
	feComposite3.setAttribute("operator", "over");
	feComposite3.setAttribute("in", "shadow");
	feComposite3.setAttribute("in2", "SourceGraphic");
	gaussFilter.appendChild(feComposite3);

	// set shadow
	if(this.settings.showInnerShadow == true)
	{
		this.paper.canvas.childNodes[2].setAttribute("filter", "url(#" + this.settings.id + "-inner-shadow)");
		this.paper.canvas.childNodes[3].setAttribute("filter", "url(#" + this.settings.id + "-inner-shadow)");
	}
}
  
  })(angular,Raphael);