/**
 * Created by Alexander Tylnyj 30.11.13 15:19
 */
(function(){
	"use strict";

	var timer;

	function Timer(el){
		var outputEls = el.getElementsByClassName("time-output"),
			time,
			interval;

		function padNumber(n){
			return n < 10 ? "0" + n : n;
		}

		function outputTime(t, i){
			outputEls[i].textContent = padNumber(t);
		}

		function tock(){
			time[1]++;
			if(time[1] === 60){
				time[1] = 0;
				time[0]++;
			}
			time.forEach(outputTime);
		}

		this.start = function(){
			time = [0,0];
			time.forEach(outputTime);
			this.stop();
			interval = setInterval(tock, 1000);
		};
		this.stop = function(){
			clearInterval(interval);
		};
	}

	document.addEventListener("DOMContentLoaded", function(){//TODO: move to first execution call
		timer = new Timer(document.getElementsByClassName("timer-wrapper")[0]);
		window.FileManager.timer = timer;
	})











})();