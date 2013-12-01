/**
 * Created by Alexander Tylnyj 30.11.13 15:19
 */
(function(){
	"use strict";

	var timer, reportObj;

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
			el.classList.remove(window.FileManager.elements.hiddenClass);
			interval = setInterval(tock, 1000);
		};
		this.stop = function(){
			if(interval){
				el.classList.add(window.FileManager.elements.hiddenClass);
				clearInterval(interval);
				interval = null;
			}
		};
	}

	function ReportObj(){
		var billingPropertysNames = {
				"nodeNum": "Node #",
				"nodeServerTime": "Node server time",
				"systemTime": "System time",
				"userTime": "User time",
				"memoryUsed": "Memory used",
				"SwapUsed": "Swap used",
				"readsFromDisk": "Number of reads from disk",
				"bytesReadFromDisk": "Number of bytes read from disk",
				"writesToDisk": "Number of writes to disk",
				"bytesWrittenToDisk": "Number of bytes written to disk",
				"readsFromNetwork": "Number of reads from network",
				"bytesReadFromNetwork": "Number of bytes read from network",
				"writesToNetwork": "Number of writes to network",
				"bytesWrittenToNetwork": "Number of bytes written to network"
			},
			executionPropertyName = {
				"retcode": "retcode",
				"etag": "etag",
				"status": "status",
				"system": "system",
				"cdr-total": "cdr-total",
				"validation": "validation"
			};

		function createRow(objArr, propertyName){
			var tr = document.createElement("tr"),
				th = document.createElement("th"),//TODO: extract ths into separated table for scrolling purposes
				td, i, len, postfix;
			th.textContent = billingPropertysNames[propertyName];
			tr.appendChild(th);
			if(typeof objArr === "number"){
				len = objArr;
				for(i = 1; i <= len; i++){
					td = document.createElement("td");
					if(i > 3){
						postfix = "th";
					}else{
						switch(i){
							case 1:
								postfix = "st";
								break;
							case 2:
								postfix = "nd";
								break;
							case 3:
								postfix = "rd";
								break;
						}
					}
					td.textContent = i + postfix;
					tr.appendChild(td);
				}
				return tr;
			}
			objArr.forEach(function(obj){
				td = document.createElement("td");
				td.textContent = obj[propertyName];
				tr.appendChild(td);
			});
			return tr;
		}

		function createExecReport(report){
			var wrapper = document.createElement("table");
			Object.keys(report.execution).forEach(function(propName){
				var th = document.createElement("th"),
					td = document.createElement("td"),
					tr = document.createElement("tr");
				th.textContent = executionPropertyName[propName];
				tr.appendChild(th);
				td.textContent = report.execution[propName];
				tr.appendChild(td);
				wrapper.appendChild(tr);
			});
			return wrapper;
		}

		function createBillReport(report){
			var wrapper = document.createElement("table");
			wrapper.appendChild(createRow(report.billing.nodes.length, "nodeNum"));
			Object.keys(report.billing.nodes[0]).forEach(function(propertyName){
				wrapper.appendChild(createRow(report.billing.nodes, propertyName));
			});
			return wrapper;
		}

		function createResultReport(report){
			var wrapper = document.createElement("div");
			wrapper.textContent = report;
			return wrapper;
		}

		this.createReportEl = function(result, report){
			var fragment = document.createDocumentFragment();
			fragment.appendChild(createExecReport(report));
			fragment.appendChild(createBillReport(report));
			fragment.appendChild(createResultReport(result));
			window.FileManager.elements.reportWrapper.removeChildren();
			window.FileManager.elements.reportWrapper.appendChild(fragment);
		};
	}



	/*FileManager.ENABLE_ZEROVM - execute condition*/



	function singleTimeFire(e){
		window.removeEventListener(e.type, singleTimeFire);
		window.FileManager.files.ontransition(document.getElementsByClassName("old-scrolling-content")[0])
		document.body.classList.remove(window.FileManager.elements.bodyReportClass);
	}

	function execute(args) {
		!timer && (timer = new Timer(document.getElementsByClassName("timer-wrapper")[0]));
		timer.start();
		document.body.classList.add(window.FileManager.elements.bodyReportClass);
		window.addEventListener("hashchange", singleTimeFire);
		ZeroVmOnSwift.execute({
			data: args.data,
			contentType: args.contentType,
			success: args.success ? args.success : function (result, report) {
				timer.stop();
				reportObj.createReportEl(result, report);
				document.body.classList.add("report-shown");
				FileManager.Loading.hide();
				document.body.classList.remove('disabled');
			},
			error: args.error ? args.error : function (status, statusText, result) {
				timer.stop();


				var report = JSON.parse('{"execution":{"retcode":"0,0,0,0,0,0,0,0,0,0,0,0","etag":"disable,/dev/stderr d41d8cd98f00b204e9800998ecf8427e,/dev/stderr d41d8cd98f00b204e9800998ecf8427e,/dev/stderr d41d8cd98f00b204e9800998ecf8427e,/dev/stderr d41d8cd98f00b204e9800998ecf8427e,/dev/stderr d41d8cd98f00b204e9800998ecf8427e,/dev/stderr d41d8cd98f00b204e9800998ecf8427e,/dev/stderr d41d8cd98f00b204e9800998ecf8427e /dev/output 7a76c15c6641a18e0f791618613941fd,disable,disable,disable,disable","status":"ok,ok,ok,ok,ok,ok,ok,ok,ok,ok,ok,ok","system":"doc,filesender1,filesender2,filesender3,filesender4,filesender5,filesender6,indexer,other,pdf,txt,xmlpipecreator","cdr-total":"12 14382 70 1360 120 1939104 3132 24428 1309 8622 140 8622","validation":"0,0,0,0,0,0,0,0,0,0,0,0"},"billing":{"totalServerTime":"1.525","nodes":[{"nodeServerTime":" 1.179","systemTime":"0.01","userTime":"0.14","memoryUsed":"7","SwapUsed":"380117","readsFromDisk":"7","bytesReadFromDisk":"380117","writesToDisk":"327","bytesWrittenToDisk":"1357","readsFromNetwork":"6","bytesReadFromNetwork":"0","writesToNetwork":"0","bytesWrittenToNetwork":"0"},{"nodeServerTime":"1.088","systemTime":"0.00","userTime":"0.08","memoryUsed":"2","SwapUsed":"1522","readsFromDisk":"2","bytesReadFromDisk":"1522","writesToDisk":"87","bytesWrittenToDisk":"429","readsFromNetwork":"0","bytesReadFromNetwork":"0","writesToNetwork":"1","bytesWrittenToNetwork":"602"},{"nodeServerTime":"1.087","systemTime":"0.00","userTime":"0.08","memoryUsed":"2","SwapUsed":"1169","readsFromDisk":"2","bytesReadFromDisk":"1169","writesToDisk":"85","bytesWrittenToDisk":"423","readsFromNetwork":"0","bytesReadFromNetwork":"0","writesToNetwork":"1","bytesWrittenToNetwork":"245"},{"nodeServerTime":"1.088","systemTime":"0.01","userTime":"0.08","memoryUsed":"2","SwapUsed":"1169","readsFromDisk":"2","bytesReadFromDisk":"1169","writesToDisk":"85","bytesWrittenToDisk":"423","readsFromNetwork":"0","bytesReadFromNetwork":"0","writesToNetwork":"1","bytesWrittenToNetwork":"245"},{"nodeServerTime":"1.383","systemTime":"0.00","userTime":"0.08","memoryUsed":"2","SwapUsed":"1187","readsFromDisk":"2","bytesReadFromDisk":"1187","writesToDisk":"87","bytesWrittenToDisk":"425","readsFromNetwork":"0","bytesReadFromNetwork":"0","writesToNetwork":"1","bytesWrittenToNetwork":"264"},{"nodeServerTime":"1.090","systemTime":"0.00","userTime":"0.09","memoryUsed":"2","SwapUsed":"1166","readsFromDisk":"2","bytesReadFromDisk":"1166","writesToDisk":"85","bytesWrittenToDisk":"420","readsFromNetwork":"0","bytesReadFromNetwork":"0","writesToNetwork":"1","bytesWrittenToNetwork":"239"},{"nodeServerTime":"1.088","systemTime":"0.01","userTime":"0.08","memoryUsed":"2","SwapUsed":"1173","readsFromDisk":"2","bytesReadFromDisk":"1173","writesToDisk":"85","bytesWrittenToDisk":"427","readsFromNetwork":"0","bytesReadFromNetwork":"0","writesToNetwork":"1","bytesWrittenToNetwork":"253"},{"nodeServerTime":"1.399","systemTime":"0.01","userTime":"0.27","memoryUsed":"73","SwapUsed":"11581","readsFromDisk":"73","bytesReadFromDisk":"11581","writesToDisk":"234","bytesWrittenToDisk":"11432","readsFromNetwork":"3","bytesReadFromNetwork":"5123","writesToNetwork":"0","bytesWrittenToNetwork":"0"},{"nodeServerTime":"1.097","systemTime":"0.01","userTime":"0.08","memoryUsed":"1","SwapUsed":"926","readsFromDisk":"1","bytesReadFromDisk":"926","writesToDisk":"482","bytesWrittenToDisk":"2011","readsFromNetwork":"6","bytesReadFromNetwork":"0","writesToNetwork":"0","bytesWrittenToNetwork":"0"},{"nodeServerTime":"1.104","systemTime":"0.01","userTime":"0.15","memoryUsed":"25","SwapUsed":"1537228","readsFromDisk":"25","bytesReadFromDisk":"1537228","writesToDisk":"241","bytesWrittenToDisk":"1141","readsFromNetwork":"6","bytesReadFromNetwork":"0","writesToNetwork":"0","bytesWrittenToNetwork":"0"},{"nodeServerTime":"1.389","systemTime":"0.01","userTime":"0.09","memoryUsed":"1","SwapUsed":"922","readsFromDisk":"1","bytesReadFromDisk":"922","writesToDisk":"802","bytesWrittenToDisk":"3395","readsFromNetwork":"12","bytesReadFromNetwork":"1848","writesToNetwork":"30","bytesWrittenToNetwork":"1651"},{"nodeServerTime":"1.390","systemTime":"0.00","userTime":"0.14","memoryUsed":"1","SwapUsed":"944","readsFromDisk":"1","bytesReadFromDisk":"944","writesToDisk":"532","bytesWrittenToDisk":"2545","readsFromNetwork":"1276","bytesReadFromNetwork":"1651","writesToNetwork":"104","bytesWrittenToNetwork":"5123"}]}}');
				var result = "asdf";
				console.log("error")
				reportObj.createReportEl(result, report);



				FileManager.Loading.hide();
				document.body.classList.remove('disabled');
				/*
				window.FileManager.errorMsgHandler.show({
					header:"An error occured. Here is what server has said: " + result,
					status: status,
					statusText: statusText
				});*/
			}
		});
	}

	reportObj = new ReportObj();
	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.fileExecutor = {
		execute: execute
	};
})();