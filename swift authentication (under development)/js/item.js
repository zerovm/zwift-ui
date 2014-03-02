(function(){
	"use strict";

	var selectedPath = null,
		previousParent,
		appearClass = "appear-submenu",
		submenu = new Submenu(),
		itemCommandName,
		progressElWrapper;

	var __el;

	function onItemClick(itemEl){
		__el = itemEl;
		var name = itemEl.dataset.path,
			curPath = CurrentPath(),
			fullPath;
		if(itemEl.dataset.fullPath){
			fullPath = new window.Path(name).isFile() ? itemEl.dataset.fullPath : itemEl.dataset.fullPath + "/";
		}else{
			fullPath = itemEl.dataset.path;
		}

		if(!name || fullPath !== curPath.withoutAccount() + itemEl.dataset.path){
			return;
		}
		selectedPath = curPath.add(name);
		location.hash = selectedPath;
	}

	function ItemCommandName(){
		var command;
		this.set = function(n){
			command = n;
		};
		this.pop = function(){
			var result = command;
			command = null;
			return result;
		};
	}

	function ajaxError(status, statusText){
		document.getElementById('mainProgressBar').classList.remove('hidden');
		window.FileManager.errorMsgHandler.show({
			header: "Ajax error:",
			status: status,
			statusText: statusText
		});
	}

	function copy(sourcePath, newName, isReloaded){
		var args;

		function ajaxError(status, statusText){
			window.FileManager.errorMsgHandler.show({
				header: "Error:",
				status: status,
				statusText: statusText
			})
		}

		args = {
			path: newName,
			copyFrom: sourcePath,
			copied: isReloaded ? window.refreshItemList : function(){},
			error: ajaxError
		};

		SwiftV1.copyFile(args);
	}

	function deleteItem(el){
		var name = el.dataset.path,
			itemPath = CurrentPath().add(name),
			progressObj;
		if(FileManager.ENABLE_SHARED_CONTAINERS
			&& FileManager.Shared.isShared(name)
			&& el.dataset.type === "shared"){
			SharedContainersOnSwift.removeSharedContainer({
				account: new Path(name).account(),
				container: new Path(name).container(),
				removed: function(){
					window.refreshItemList();
				},
				error: ajaxError
			});
			return;
		}
		if(el.dataset.type === "file"){
			SwiftV1.delete({
				path: new Path(itemPath).withoutAccount(),
				deleted: function(){
					window.refreshItemList();
				},
				error: ajaxError,
				notExist: function(){
					window.refreshItemList();
				}
			});
			return;
		}

		document.getElementById('mainProgressBar').classList.remove('hidden');
		progressObj = new window.FileManager.toolbox.ProgressBar({
			wrapper: progressElWrapper
		});
		recursiveDeleteOnSwift({
			path: new Path(itemPath).withoutAccount(),
			account: CurrentPath().account(),
			deleted: function(){
				document.getElementById('mainProgressBar').classList.add('hidden');
				progressObj.remove();
				window.refreshItemList();
			},
			progress: function(totalFiles, deletedFiles){
				totalFiles = totalFiles - 1;
				var percentComplete = deletedFiles / totalFiles * 100;
				progressObj.setProgressValue(percentComplete);
				//console.log('Deleting... (' + deletedFiles + '/' + totalFiles + ') ' + percentComplete + '% complete.');
			},
			error: function(s, st){
				ajaxError(s, st);
				progressObj.remove();
			}
		});
	}

	function toggleMenu(e){
		var parent = FileManager.toolbox.getParentByClassName(e, 'item');
		if(previousParent === parent){
			submenu.appear()
		}else{
			//window.FileManager.DialogForm.closeOtherDialogs();
			submenu.appear(parent);
		}
		previousParent = parent;
	}

	function open(path){
		var args = {
			path: path
		};
		window.FileManager.fileExecutor.open(args);
	}

	function execute(path){
		var args = {
			path: path,
			success: executeData,
			error: function(status, statusText){
				window.FileManager.errorMsgHandler({header: "Ajax error:", status: status, statusText: statusText});
			},
			notExist: function(){
				window.FileManager.errorMsgHandler({header: "File does not exist"});
			},
			progress: function(loaded){
				console.log(loaded + " bytes loaded...");
			}
		};

		function executeData(data, type){
			var args = {
				data: data,
				contentType: type
			};
			window.FileManager.fileExecutor.execute(args);
		}

		if(FileManager.ENABLE_SHARED_CONTAINERS){
			args.account = CurrentPath().account();
		}
		SwiftV1.getFile(args);//TODO: should there be ability of canceling?
		//FileManager.File.getFileXhr = SwiftV1.getFile(args);
	}

	function Submenu(){
		var button, wrapper, path,
			buttonsClass = "submenu-items",
			actionPrefix = "on",
			oncopy,
			handlers,
			transtionHandler = new TransitionHandler();

		function TransitionHandler(){
			var scrollEl, interval,
				scrollOffsetDx = 5;

			function onTransitionEnd(e){
				var desiredScroll;
				wrapper.removeEventListener(e.type, onTransitionEnd);
				if(this === e.target){
					desiredScroll = wrapper.offsetTop - scrollEl.clientHeight + this.offsetHeight;
					interval = setInterval(function(){
						var spScroppTop = scrollEl.parentNode.scrollTop;
						if(desiredScroll > spScroppTop){
							scrollEl.parentNode.scrollTop = spScroppTop + scrollOffsetDx;
						}else{
							clearInterval(interval);
						}
					}, 16);
				}
			}

			this.bind = function(el){
				scrollEl = document.getElementById('List');
				this.bind = function(el){
					setTimeout(function(){
						el.addEventListener('webkitTransitionEnd', onTransitionEnd);
						el.addEventListener('transitionend', onTransitionEnd);
						el.addEventListener('oTransitionEnd otransitionend', onTransitionEnd);
						el.addEventListener('MSTransitionEnd', onTransitionEnd);
					}, 0);
				};
				this.bind(el);
			}
		}

		function createDeleteDialog(){
			var textEl = document.createElement("span");
			textEl.innerHTML = "Are you sure you want to delete <strong>" + previousParent.dataset.path + "</strong>?";
			return textEl;
		}

		this.appear = function(parentEl){
			if(parentEl){
				wrapper.classList.remove(appearClass);
				wrapper.parentNode && submenu.removeSubmenu();
				this.setPath(parentEl.dataset.path);
				parentEl.parentNode.insertBefore(wrapper, parentEl.nextSibling);
				setTimeout(function(){
					wrapper.classList.add(appearClass);
				}, 30);//30 is for firefox slow working
			}else{
				wrapper.classList.toggle(appearClass)
			}
			transtionHandler.bind(wrapper);
		};

		this.removeSubmenu = function(){
			previousParent = null;
			submenu.wrapper.classList.remove(appearClass);
			submenu.wrapper.parentNode.removeChild(submenu.wrapper);
		};

		this.setPath = function(p){
			path = p;
		};

		this.wrapper = wrapper = document.createElement("div");
		wrapper.className = "item submenu no-hover no-active";
		oncopy = function(){
			var dialogForm = new window.FileManager.DialogForm({
					wrapperId: "CopyDialog",
					isAlwaysVisible: true
				}),
				wrapper = document.createElement("div");

			function removeForm(e){
				var parent = e.target ? e.target.parentNode : e;
				wrapper.removeChild(parent);
				if(!wrapper.children.length){
					dialogForm.hide();
				}
			}

			function onsubmit(form, isReloaded){
				var inputValue = form[0].value,
					newName = inputValue ? window.CurrentPath().withoutAccount() + inputValue : window.CurrentPath().withoutAccount() + "asdf";
				console.log("caller:",form.dataset.srcPath, newName)
				copy(form.dataset.srcPath, newName, isReloaded);

				removeForm(form);
				//console.log(form.dataset.srcPath, newName);
			}

			function customSubmit(e){
				onsubmit(this, true);
				e.preventDefault();
				e.stopPropagation();
				return false;
			}

			function createCopyItem(sourcePath){
				var form = document.createElement("form"),
					input = document.createElement("input"),
					button,
					sourceName = sourcePath;
				form.dataset.srcPath = sourceName;
				input.placeholder = "New name of file";
				input.type = "text";
				input.value = previousParent.dataset.path;
				form.appendChild(input);

				button = document.createElement("button");
				button.textContent = "Copy";
				button.className = "btn btn-primary";
				button.type = "submit";
				form.appendChild(button);

				button = document.createElement("button");
				button.textContent = "Cancel";
				button.className = "btn btn-default";
				button.type = "button";
				button.addEventListener("click", removeForm);
				form.appendChild(button);

				form.addEventListener("submit", customSubmit);
				wrapper.appendChild(form);
			}

			oncopy = function(){
				var sourcePath = previousParent.dataset.fullPath,
					isCoincidence;
				wrapper.children.forEach(function(form){
					if(form.dataset.srcPath === sourcePath){
						isCoincidence = true;
					}
				});
				if(wrapper.children.length){
					if(!isCoincidence){
						createCopyItem(sourcePath);
					}
				}else{
					dialogForm.show({
						type: "dialog",
						dialogContent: wrapper,
						onshow: function(){
							createCopyItem(sourcePath);
						},
						confirm: function(){
							var arr = wrapper.children,
								i = arr.length - 1;
							for (i; i >= 1; i--){
								onsubmit(arr[i]);
							}
							onsubmit(arr[0], true);
							dialogForm.hide();
						},
						decline: function(){
							wrapper.removeChildren();
							wrapper.parentNode && wrapper.parentNode.removeChild(wrapper);
						},
						hashchangeHandler: function(){
							var currentPath = window.CurrentPath();
							if(currentPath.isContainersList()){
								dialogForm.el.classList.add("disabled");
							}else{
								dialogForm.el.classList.remove("disabled");
							}
							if(currentPath.isFile()){
								dialogForm.hide();
							}
						},
						inputValue: previousParent.dataset.path
					});
				}
			};
			oncopy();
		};
		handlers = {
			onopen: function(){
				itemCommandName.set("open");
				onItemClick(previousParent);
			},
			ondownload: function(e){
				window.FileManager.toolbox.downloadClick(SwiftV1.xStorageUrl + CurrentPath().get() + previousParent.dataset.path, previousParent.dataset.path);
			},
			oncopy: function(){
				oncopy();
			},
			onmetadata: function(e){
				Metadata.loadMetadata(window.CurrentPath().get() + previousParent.dataset.path);
			},
			ontype: function(e){
				window.FileManager.dialogForm.show({
					type: "input",
					placeholder: "New file type",
					customizationClass: "change-type",
					confirm: function(input){

						if (!input.value) {
							window.FileManager.dialogForm.hide();
							return;
						}
						SwiftV1.File.post({
							contentType: input.value,
							updated: window.refreshItemList,
							path: window.CurrentPath().withoutAccount() + previousParent.dataset.path,
							error: ajaxError
						});
						window.FileManager.dialogForm.hide();
					},
					inputValue: previousParent.dataset.contentType
				});
			},
			ondelete: function(e){
				var dialog = window.FileManager.dialogForm;
				dialog.show({
					confirm: function(){
						deleteItem(previousParent);
						window.FileManager.dialogForm.hide();
					},
					onshow: function(){
						var button = dialog.el.getElementsByClassName("btn-primary")[0];
						button && button.focus();
					},
					dialogContent: createDeleteDialog(),
					type: "dialog"
				});
			},
			onexecute: function(){
				itemCommandName.set("execute");
				onItemClick(previousParent);
			},
			onedit: function(e){
				onItemClick(previousParent);
			}
		};
		Object.keys(handlers).forEach(function(className){
			className = className.replace(actionPrefix, "");
			button = document.createElement("button");
			button.className = className + " " + buttonsClass;
			button.title = className;
			button.dataset.action = className;
			wrapper.appendChild(button);
		});
		wrapper.addEventListener("click", function(e){
			var actionEl = FileManager.toolbox.getParentByClassName(e.target, buttonsClass),
				handler;
			e.preventDefault();
			e.stopPropagation();
			if(actionEl){
				handler = actionPrefix + actionEl.dataset.action;
				handlers[handler] && handlers[handler]();
			}
		});
	}

	itemCommandName = new ItemCommandName();
	document.addEventListener("DOMContentLoaded", function(){
		//loadingHtml = document.querySelector('#itemLoadingTemplate').innerHTML;//TODO: replace this s...
		progressElWrapper = document.getElementById("progressDialog");
	});

	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.item = {
		selectedPath: selectedPath,
		click: onItemClick,
		toggleMenu: toggleMenu,
		itemCommandName: itemCommandName,
		open: open,
		execute: execute,
		el: function () {
			return __el;
		}
	};
})();