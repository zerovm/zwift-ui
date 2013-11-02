/**
 * User: Alexander
 * Date: 30.10.13
 * Time: 17:56
 *
 * requires popup, fileListHandler, progress, imgPreload
 */
(function(){
	"use strict";

	var popupClassName = "file-selector",
		dotStartRegex = /^\./,
		allSlashRegex = /\//g,
		slashStr = "/",
		emptyString = "",
		trString = "tr",
		tdString = "td",
		imgString = "img",
		iconMap = {
			"text/plain": "img/file32_txt.png",
			"application/pdf": "img/file32_pdf.png",
			"application/msword": "img/file32_doc.png",
			"application/doc": "img/file32_doc.png",
			"application/docx": "img/file32_doc.png",
			".h": "img/file32_c.png",
			".c": "img/file32_c.png",
			"text/x-lua": "img/file32_lua.png",
			"application/directory": "img/folder32.png",
			"application/file": "img/file32.png"
		},
		gradeMap = ["B", "KB", "MB", "GB"],
		trClassName = "item",
		trSelectedClassName = "selected",
		isImagesLoaded;

	function checkParentClassName(el, className){//TODO: append to htmlnodeelement
		var topParentTag = "BODY";
		while(el.tagName !== topParentTag){
			if(el.classList.contains(className)){
				return el;
			}
			el = el.parentNode;
		}
		return null;
	}

	function getImgSrc(contentType){
		return iconMap[contentType] || iconMap["application/file"];
	}

	function getTransformedBytes(bytes){
		var counter = 1,
			grade = 1024,
			checksum = Math.pow(grade, counter);
		while(bytes > checksum){
			counter++;
			checksum = Math.pow(grade, counter);
		}
		return (bytes / Math.pow(grade, counter - 1)).toFixed(2) + gradeMap[counter - 1];
	}

	function getInvertedDate(time){
		var alternative = (new Date(time)).toDateString();

		var diff = ((new Date()).getTime() - (new Date(time)).getTime()) / 1000,
			day_diff = Math.floor(diff / 86400);

		if(isNaN(day_diff) || day_diff < 0 || day_diff >= 31)
			return alternative;

		var pretty = day_diff == 0 && (
			diff < 60 && "just now" ||
				diff < 120 && "1 minute ago" ||
				diff < 3600 && Math.floor(diff / 60) + " minutes ago" ||
				diff < 7200 && "1 hour ago" ||
				diff < 86400 && Math.floor(diff / 3600) + " hours ago") ||
			day_diff == 1 && "Yesterday" ||
			day_diff < 7 && day_diff + " days ago" ||
			day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago";

		return pretty || alternative;
	}

	function FileSelector(params){
		var popup, pathObj, fragment,
			that = this,
			chosenFileList,
			chosenFileListArray,
			isEverythingOk = true,
			table;

		function onBroke(response){
			isEverythingOk = false;
			pathObj = null;
			console.log("error ocured while fetching files\n", response);
		}

		function getAllDescendants(obj){
			var i = 0, resultArray = [],
				stack = obj.childNodes.getArrayOfProperties();
			while(stack[i]){
				if(stack[i].childNodes){
					stack[i].childNodes.getArrayOfProperties().forEach(function(pathObj){
						stack.push(pathObj);
					});
				}else{
					resultArray.push(stack[i]);
				}
				i++;
			}
			return resultArray;
		}

		function createNodes(obj, containerName){
			var tr = document.createElement(trString), td, img,
				innerText = tr.innerText ? "innerText" : "textContent";//TODO: extend htmlelement
			tr.dataset.path = obj.fullPath || obj.name;
			tr.className = trClassName;
			td = document.createElement(tdString);
			td.className = "item-icon radio";
			td.appendChild(document.createElement("span"));
			tr.appendChild(td);

			td = document.createElement(tdString);
			img = document.createElement(imgString);
			img.src = getImgSrc(obj.content_type);
			td.appendChild(img);
			td.className = "item-icon";
			tr.appendChild(td);

			td = document.createElement(tdString);
			td[innerText] = containerName;
			td.className = "item-name";
			tr.appendChild(td);

			td = document.createElement(tdString);
			obj.bytes && (td[innerText] = getTransformedBytes(parseInt(obj.bytes)));
			td.className = "item-size";
			tr.appendChild(td);

			td = document.createElement(tdString);
			obj.last_modified && (td[innerText] = getInvertedDate(obj.last_modified));
			td.className = "item-modified";
			tr.appendChild(td);

			return tr;
		}

		function getNode(path){
			var resultNodes = pathObj;
			path.split(allSlashRegex).filter(function(str){
				return str;
			}).forEach(function(nodeName){
					resultNodes = resultNodes.childNodes[nodeName];
				});
			return resultNodes;
		}

		function createBackbutton(path){
			var button = document.createElement("button");
			button.className = "back-button";
			button.addEventListener("click", function(e){
				e.stopPropagation();
				that.show(path);
			});
			return button;
		}

		function createHTML(path){
			var shownObject, topperLevel, currentDirectory,
				topWrapper = document.createElement("div"),
				tableWrapper = document.createElement("div"),
				pathHeaderEl;
			topWrapper.className = "top-wrapper";
			tableWrapper.className = "table-wrapper";
			pathHeaderEl = document.createElement("h2");
			table = document.createElement("table");
			fragment = document.createDocumentFragment();
			if(path){
				topperLevel = path.split(allSlashRegex).filter(function(str){return str});
				currentDirectory = topperLevel.pop();
				topperLevel = topperLevel.join(slashStr);
				topWrapper.appendChild(createBackbutton(topperLevel));
				pathHeaderEl.innerText ? pathHeaderEl["innerText"] = topperLevel + currentDirectory + slashStr : pathHeaderEl["textContent"] = topperLevel + currentDirectory + slashStr;
				shownObject = getNode(path).childNodes;

			}else{
				pathHeaderEl.innerText ? pathHeaderEl["innerText"] = "Root" : pathHeaderEl["textContent"] = "Root";
				shownObject = pathObj.childNodes;
			}
			Object.keys(shownObject).forEach(function(containerName){
				table.appendChild(createNodes(shownObject[containerName], containerName));
			});

			topWrapper.appendChild(pathHeaderEl);
			fragment.appendChild(topWrapper);
			tableWrapper.appendChild(table);
			fragment.appendChild(tableWrapper);
			return fragment;
		}

		function createPathObj(containerListArray){
			var containerCounter = 0, containerNum = 0;

			function createContainerBranch(containerContentArray, containerWideName){
				var containerName = containerWideName.replace(allSlashRegex, emptyString);
				if(isEverythingOk){
					containerCounter++;
					containerContentArray.forEach(function(el){
						var curNode = pathObj.childNodes[containerName], prevNode,
							splittedPath = el.name.split(allSlashRegex).filter(function(name){
								return name;
							});
						splittedPath.forEach(function(node){
							prevNode = curNode;
							if(!curNode.childNodes){
								curNode.childNodes = {};
							}
							if(!curNode.childNodes[node]){
								curNode.childNodes[node] = {};
							}
							curNode = curNode.childNodes[node];
						});
						prevNode.childNodes[splittedPath[splittedPath.length - 1]] = el.createCopy();
						prevNode.childNodes[splittedPath[splittedPath.length - 1]].fullPath = slashStr + containerName + slashStr + el.name;
					});
					if(containerCounter === containerNum){
						//createHTML();
						params && params.oncreate && params.oncreate();
						window.grepApp.progress.end();
					}
				}
			}

			if(isEverythingOk){
				pathObj = {childNodes: {}};
				containerListArray.forEach(function(container){
					if(!container.name.match(dotStartRegex)){
						containerNum++;
						pathObj.childNodes[container.name] = container.createCopy();
						window.grepApp.getFilelist({
							input:container.name,
							onsuccess:createContainerBranch,
							onerror:onBroke
						});
					}
				});
			}
		}

		function onConfirm(){
			chosenFileListArray = [];
			Object.keys(chosenFileList).map(function(path){
				return path;
			}).forEach(function(path){
					var pathSubObjs = getNode(path),
						pathesArray;
					if(pathSubObjs.childNodes){
						pathesArray = getAllDescendants(pathSubObjs).map(function(pathObj){
							return pathObj.fullPath;
						});
						chosenFileListArray = chosenFileListArray.concat(pathesArray);
					}else{
						chosenFileListArray.push(path);
					}
				});
			chosenFileList = {};
			params && params.onconfirm && params.onconfirm();
		}

		function onDecline(){
			chosenFileList = {};
			chosenFileListArray;
			params && params.ondecline() && params.ondecline();
		}

		function getFileList(){
			window.grepApp.progress.start();
			params && params.onbeforeCreate && params.onbeforeCreate.apply(that);
			window.grepApp.getFilelist({
				input: emptyString,
				onsuccess:createPathObj,
				onerror:onBroke
			});
		}

		this.show = function(path, isEmpty){
			var isDirectory;
			chosenFileList = {};
			params && params.onshow && params.onshow();
			if(isEmpty){
				popup.show();
				return;
			}
			if(path){
				isDirectory = getNode(path).childNodes;
				isDirectory && popup.show(createHTML(path));
			}else{
				popup.show(createHTML());
			}
		};
		this.getChosenFilesArray = function(isSorted){
			if(isSorted){
				chosenFileListArray = chosenFileListArray.map(function(path){
					return getNode(path);
				}).sort(function(a,b){
						return Date.parse(a.last_modified) - Date.parse(b.last_modified);
					}).map(function(pathObj){
						return pathObj.fullPath;
					});
			}
			return chosenFileListArray;
		};
		this.reset = function(){
			chosenFileList = null;
			chosenFileListArray = null;
		};

		if(!isImagesLoaded){
			isImagesLoaded = true;
			window.grepApp.imgPreload(iconMap.getArrayOfProperties().concat(["img/up-brown.png"]));
		}
		popup = new window.grepApp.Popup({
			wrapperClassName: popupClassName,
			isDialog: true,
			confirm: onConfirm,
			decline: onDecline,
			isNotTextContent: true
		});
		popup.popupEl.addEventListener("click", function(e){
			var tr = checkParentClassName(e.target, trClassName);
			if(tr){
				if(tr.classList.contains(trSelectedClassName)){
					tr.classList.remove(trSelectedClassName);
					if(chosenFileList[tr.dataset.path]){
						chosenFileList[tr.dataset.path] = null;
					}
				}else{
					tr.classList.add(trSelectedClassName);
					chosenFileList[tr.dataset.path] = tr;
				}
			}
		});
		popup.popupEl.addEventListener("dblclick", function(e){
			var tr = checkParentClassName(e.target, trClassName);
			if(tr){
				Object.keys(chosenFileList).forEach(function(key){
					chosenFileList[key] && chosenFileList[key].classList.remove(trSelectedClassName);
				});
				chosenFileList = {};
				that.show(tr.dataset.path);
			}
		});
		getFileList();

	}

	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.FileSelector = FileSelector;
})();