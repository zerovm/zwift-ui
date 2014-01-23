/**
 * Created by Alexander Tylnyj 30.11.13 15:19
 */
(function(){
	"use strict";

	var timer, reportObj, billingScroll;

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
			time = [0, 0];
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
				"nodeNum": "Node",
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
			},
			billingHeaderTable, billingContentTable, that = this;

		function createRow(objArr, propertyName){
			var tr = document.createElement("tr"),
				td, i, len, postfix;
			if(typeof objArr === "number"){
				len = objArr;
				for(i = 1; i <= len; i++){
					td = document.createElement("th");
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

		function createHeaderTable(){
			var table = document.createElement("table");
			Object.keys(billingPropertysNames).forEach(function(propertyName){
				var th = document.createElement("th"),
					tr = document.createElement("tr");
				th.textContent = billingPropertysNames[propertyName];
				tr.appendChild(th);
				table.appendChild(tr);
			});
			return table;
		}

		function createExecReport(report){
			var wrapper = document.createElement("table");
			wrapper.className = "execution-report";
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

		function createScrollWrapper(iscroll, isInverse){
			var button = document.createElement("button");
			button.addEventListener("click", function(e){
				var curPage = iscroll.currPageX;
				e.stopPropagation();
				iscroll.scrollToPage(isInverse ? curPage + 1 : (curPage ? curPage - 1 : curPage), 0);
			});
			return button;
		}

		function createBillReport(report){
			var contentTableWrapper = document.createElement("div"),
				sideTableWrapper = document.createElement("div"),
				wrapper = document.createElement("div"),
				thead = document.createElement("thead"),
				tbody = document.createElement("tbody");
			that.billingContentTable = billingContentTable = document.createElement("table");
			wrapper.className = "billing-wrapper";
			contentTableWrapper.className = "content-table-wrapper";
			sideTableWrapper.className = "side-table-wrapper";
			billingHeaderTable = createHeaderTable();
			sideTableWrapper.appendChild(billingHeaderTable);
			wrapper.appendChild(sideTableWrapper);

			thead.appendChild(createRow(report.billing.nodes.length, "nodeNum"));
			Object.keys(report.billing.nodes[0]).forEach(function(propertyName){
				tbody.appendChild(createRow(report.billing.nodes, propertyName));
			});
			billingContentTable.appendChild(thead);
			billingContentTable.appendChild(tbody);
			contentTableWrapper.appendChild(billingContentTable);
			wrapper.appendChild(contentTableWrapper);

			billingScroll = new iScroll(reportObj.billingContentTable.parentNode, {vScroll: false, hScrollbar: false, bounce: false});
			window.my = billingScroll;
			contentTableWrapper.appendChild(createScrollWrapper(billingScroll, false));
			contentTableWrapper.appendChild(createScrollWrapper(billingScroll, true));
			return wrapper;
		}

		function createResultReport(report){
			var wrapper = document.createElement("div");
			wrapper.textContent = report ? report : "There is no output data.";
			wrapper.className = "result-report";
			return wrapper;
		}

		this.alignTables = function(){
			var contentElements = billingContentTable.querySelectorAll("tr td:first-child");
			billingHeaderTable.getElementsByTagName("th").forEach(function(th, index){
				contentElements[index - 1] && (contentElements[index - 1].style.height = getComputedStyle(th, null)["height"]);
			});
		};

		this.createReportEl = function(result, report){
			var fragment = document.createDocumentFragment(),
				header;
			header = document.createElement("h1");
			header.textContent = "Execution Report";
			fragment.appendChild(header);
			fragment.appendChild(createExecReport(report));
			header = document.createElement("h1");
			header.textContent = "Billing Report";
			fragment.appendChild(header);
			fragment.appendChild(createBillReport(report));
			header = document.createElement("h1");
			header.textContent = "Output Data";
			fragment.appendChild(header);
			fragment.appendChild(createResultReport(result));
			window.FileManager.elements.reportWrapper.appendChild(fragment);
		};
	}

	function singleTimeFire(e){
		billingScroll && billingScroll.destroy();
		window.removeEventListener(e.type, singleTimeFire);
		window.FileManager.elements.reportWrapper.removeChildren();
		(function(){//TODO: rewrite ontranstion end to get rid of this!!!!!!!!!!!!!!!!!!
			var oldContent = document.getElementsByClassName("old-scrolling-content")[0];
			oldContent && window.FileManager.files.ontransition(oldContent);
		})();
		document.body.classList.remove(window.FileManager.elements.disableToolbarClass);
		document.body.classList.remove(window.FileManager.elements.bodyReportClass);
		window.FileManager.elements.reportWrapper.classList.add(window.FileManager.elements.hiddenClass);
	}

	function onsuccess(result, report){
		timer.stop();
		reportObj.createReportEl(result, report);
		document.body.classList.remove(window.FileManager.elements.disableAllClass);
		window.FileManager.elements.reportWrapper.classList.remove(window.FileManager.elements.hiddenClass);
		reportObj.alignTables();
		setTimeout(function(){
			billingScroll.refresh();
		}, 1);
		document.body.classList.remove("disabled");
	}

	function onerror(status, statusText, result){
		timer.stop();
		document.body.classList.remove(window.FileManager.elements.disableAllClass);
		document.body.classList.remove("disabled");
		window.FileManager.errorMsgHandler.show({
			header: "An error occured. Here is what server has said: " + result,
			status: status,
			statusText: statusText,
			onclose: function(){
				var curPath = window.FileManager.CurrentPath();
				curPath.isFile() && (location.hash = curPath.up());
			}
		});
	}

	function execute(args, action){
		!timer && (timer = new Timer(document.getElementsByClassName("timer-wrapper")[0]));
		timer.start();
		document.body.classList.add(window.FileManager.elements.disableAllClass);
		document.body.classList.add(window.FileManager.elements.disableToolbarClass);
		window.FileManager.elements.reportWrapper.removeChildren();
		document.body.classList.add(window.FileManager.elements.bodyReportClass);
		setTimeout(function(){
			window.addEventListener("hashchange", singleTimeFire);
		}, 0);
		switch (action){
			case "execute":
				FileManager.ENABLE_ZEROVM && ZeroVmOnSwift.execute({
					data: args.data,
					contentType: args.contentType,
					success: args.success ? args.success : onsuccess,
					error: args.error ? args.error : onerror
				});
				break;
			case "open":
				FileManager.ENABLE_ZEROVM && ZeroVmOnSwift.open({
					path: args.path,
					contentType: args.contentType,
					success: args.success ? args.success : onsuccess,
					error: args.error ? args.error : onerror
				});
				break;
		}
	}

	reportObj = new ReportObj();
	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.fileExecutor = {
		execute: function(args){
			execute(args, "execute");
		},
		open: function(args){
			execute(args, "open");
		}
	};
})();