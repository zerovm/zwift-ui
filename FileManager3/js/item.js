(function(){
	"use strict";

	var selectedPath = null,
		previousParent,
		appearClass = "appear-submenu",
		submenu = new Submenu(),
		itemCommandName,
		progressElWrapper;

	function onItemClick(itemEl){
		var name = itemEl.dataset.path,
			curPath = FileManager.CurrentPath(),
			fullPath;
		if(itemEl.dataset.fullPath){
			fullPath = new window.FileManager.Path(name).isFile() ? itemEl.dataset.fullPath : itemEl.dataset.fullPath + "/";
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
		window.FileManager.elements.mainProgressBar.classList.remove(window.FileManager.elements.hiddenClass);
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
			copied: isReloaded ? window.FileManager.files.refreshItemList : function(){},
			error: ajaxError
		};
		console.log(args)
		/*TODO: correct condition
		 if(FileManager.ENABLE_SHARED_CONTAINERS && FileManager.Shared.isShared(window.FileManager.CurrentPath().account())){//TODO: check shared func
		 args.account = FileManager.Path(path).account();
		 SharedContainersOnSwift.copy(args);
		 return;
		 }*/

		SwiftV1.copyFile(args);
	}

	function deleteItem(el){
		var name = el.dataset.path,
			itemPath = FileManager.CurrentPath().add(name),
			progressObj;
		if(FileManager.ENABLE_SHARED_CONTAINERS
			&& FileManager.Shared.isShared(name)
			&& el.dataset.type === "shared"){
			SharedContainersOnSwift.removeSharedContainer({
				account: new FileManager.Path(name).account(),
				container: new FileManager.Path(name).container(),
				removed: function(){
					window.FileManager.files.refreshItemList();
				},
				error: ajaxError
			});
			return;
		}
		if(el.dataset.type === "file"){
			SwiftAdvancedFunctionality.delete({
				path: new FileManager.Path(itemPath).withoutAccount(),
				deleted: function(){
					window.FileManager.files.refreshItemList();
				},
				error: ajaxError,
				notExist: function(){
					window.FileManager.files.refreshItemList();
				}
			});
			return;
		}

		window.FileManager.elements.mainProgressBar.classList.remove(window.FileManager.elements.hiddenClass);
		progressObj = new window.FileManager.toolbox.ProgressBar({
			wrapper: progressElWrapper
		});
		SwiftAdvancedFunctionality.deleteAll({
			path: new FileManager.Path(itemPath).withoutAccount(),
			account: FileManager.CurrentPath().account(),
			deleted: function(){
				window.FileManager.elements.mainProgressBar.classList.add(window.FileManager.elements.hiddenClass);
				progressObj.remove();
				window.FileManager.files.refreshItemList();
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
			args.account = FileManager.CurrentPath().account();
		}
		SwiftV1.getFile(args);//TODO: should there be ability of canceling?
		//FileManager.File.getFileXhr = SwiftV1.getFile(args);
	}

	function Submenu(){
		var button, wrapper, path,
			buttonsClass = "submenu-items",
			actionPrefix = "on",
			metadataObj,
			oncopy,
			handlers,
			transtionHandler = new TransitionHandler();

		function TransitionHandler(){
			var transitionEnd = {
					"WebkitTransition": "webkitTransitionEnd",
					"MozTransition": "transitionend",
					"OTransition": "oTransitionEnd otransitionend",
					"msTransition": "MSTransitionEnd",
					"transition": "transitionend"
				}[Modernizr.prefixed("transition")],
				scrollEl, interval,
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
				scrollEl = window.FileManager.elements.itemsContainer;
				this.bind = function(el){
					setTimeout(function(){
						el.addEventListener(transitionEnd, onTransitionEnd);
					}, 0);
				};
				this.bind(el);
			}
		}

		function createDeleteDialog(){
			var textEl = document.createElement("span");
			textEl.innerHTML = "Are you sure of deleting <strong>" + previousParent.dataset.path + "</strong>?";
			return textEl;
		}

		function MetadataObj(){
			var wrapper = document.createElement("div"),
				containerType = "container",
				rowClassName = "meta-data-row",
				metaKeyClassName = "meta-key-input",
				metaValueClassName = "meta-value-input",
				errorInputClassName = "error-input",
				inputWrapperClassName = "input-wrapper",
				metadataRemoveClassName = "metadata-remove",
				disabledAttribute = "disabled",
				firstLetterRegex = /./,
				originMetadata,
				originMetadataKeys,
				lastInput;

			function createMetaInputRow(meta, value){
				var metadataWrapper = document.createElement("div"),
					inputWrapper = document.createElement("div"),
					input, button;
				metadataWrapper.className = rowClassName;
				inputWrapper.className = inputWrapperClassName;

				input = document.createElement("input");
				lastInput = input;
				input.className = metaKeyClassName;
				input.type = "text";
				meta && (input.value = decodeURIComponent(meta));
				input.placeholder = "Meta key";
				inputWrapper.appendChild(input);

				input = document.createElement("input");
				input.className = metaValueClassName;
				input.type = "text";
				value && (input.value = decodeURIComponent(value));
				input.placeholder = "Meta value";
				inputWrapper.appendChild(input);

				metadataWrapper.appendChild(inputWrapper);

				button = document.createElement("button");
				button.className = metadataRemoveClassName;
				button.tabIndex = -1;
				button.type = "button";
				metadataWrapper.appendChild(button);

				wrapper.appendChild(metadataWrapper);
			}

			function makeMetadataStandartView(str){
				return str.toLowerCase().replace(firstLetterRegex, str[0].toUpperCase());
			}

			function checkCoincidence(inputs, input){
				var i, isCoincidence, comparisonInputValue,
					inputValue = input.value;
				if(!inputValue){
					return;
				}
				inputValue = makeMetadataStandartView(inputValue);
				for(i = inputs.length - 1; i >= 0; i--){
					comparisonInputValue = inputs[i].value;
					if(comparisonInputValue){
						comparisonInputValue = makeMetadataStandartView(comparisonInputValue);
					}else{
						continue;
					}
					if(comparisonInputValue && comparisonInputValue === inputValue && inputs[i] !== input){
						isCoincidence = true;
						break;
					}
				}
				if(isCoincidence){
					input.classList.add(errorInputClassName);
					input.nextSibling.setAttribute(disabledAttribute, disabledAttribute);
				}else{
					input.classList.remove(errorInputClassName);
					input.nextSibling.removeAttribute(disabledAttribute);
				}
			}

			function checkAllErrorInputs(){
				var inputs = wrapper.getElementsByClassName(metaKeyClassName);
				wrapper.getElementsByClassName(errorInputClassName).forEach(function(input){
					checkCoincidence(inputs, input);
				});
			}

			function removeRow(row){
				row.nextSibling.getElementsByTagName("input")[0].focus();
				row.parentNode.removeChild(row);
				checkAllErrorInputs();
			}

			function getMeta(){
				var result = {};
				wrapper.getElementsByClassName(inputWrapperClassName).filter(function(el){
					return !el.firstElementChild.classList.contains(errorInputClassName);
				}).forEach(function(inputwrapper){
						var metaValue = encodeURIComponent(inputwrapper.children[0].value),
							metaKey = encodeURIComponent(inputwrapper.children[1].value);
						metaValue && metaKey && (result[metaValue] = metaKey);
					});
				return result;
			}

			this.el = wrapper;
			this.getMeta = getMeta;
			this.getRemovedMeta = function(){
				var removedMeta = [],
					currentMeta = getMeta();
				originMetadataKeys.forEach(function(key){
					if(!currentMeta[key]){
						removedMeta.push(key);
					}
				});
				return removedMeta;
			};
			this.showMetaData = function(path, type, callback){
				var args = {
					success: function(metadata){
						wrapper.removeChildren();
						originMetadata = metadata;
						originMetadataKeys = Object.keys(originMetadata);
						originMetadataKeys.forEach(function(key){
							createMetaInputRow(key, originMetadata[key]);
						});
						createMetaInputRow();
						callback(function(){
							lastInput.focus();
							lastInput.scrollIntoView();
						});
					},
					notExist: function(){
						window.FileManager.errorMsgHandler.show({
							header: "Item does not exist"
						});
					},
					error: ajaxError
				};
				path = window.FileManager.CurrentPath().withoutAccount() + path;
				window.FileManager.errorMsgHandler.hide();
				if(type === containerType){
					args.containerName = path;
					SwiftV1.Container.head(args);
				}else{
					args.path = path;
					SwiftV1.File.head(args);
				}
			};
			wrapper.className = "meta-data-wrapper";
			wrapper.addEventListener("click", function(e){
				var row;
				if(e.target.tagName === "BUTTON"){
					row = window.FileManager.toolbox.getParentByClassName(e.target, rowClassName);
					!window.FileManager.toolbox.isLastChildren(row) && removeRow(row);
				}
			});
			wrapper.addEventListener("input", function(e){
				var input = e.target,
					row = window.FileManager.toolbox.getParentByClassName(e.target, rowClassName),
					isRowLastChildren = window.FileManager.toolbox.isLastChildren(row);
				if(!input.value){
					if(!isRowLastChildren){
						removeRow(row);
					}
				}else{
					if(isRowLastChildren){
						createMetaInputRow();
					}
				}
				if(input.classList.contains(metaKeyClassName)){
					checkCoincidence(this.getElementsByClassName(metaKeyClassName), input);
				}
			});
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
					newName = inputValue ? window.FileManager.CurrentPath().withoutAccount() + inputValue : window.FileManager.CurrentPath().withoutAccount() + "asdf";
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
							var currentPath = window.FileManager.CurrentPath();
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
			onshare: function(e){
				var dialogForm = new window.FileManager.DialogForm({
					wrapperId: "RightsDialog"
				});
				dialogForm.show({
					type: "simple-dialog",
					onshow: function(){
						var xhr = SwiftV1.Container.head({
							containerName: previousParent.dataset.path,
							success: function(){
								var dialogEl = document.getElementById("RightsDialog");
								var readRights = dialogEl.getElementsByClassName("read-rights-input")[0];
								var writeRights = dialogEl.getElementsByClassName("write-rights-input")[0];
								var rights = SharedContainersOnSwift.getRights(xhr);
								readRights.value = rights.read;
								writeRights.value = rights.write;
								readRights.focus();
							},
							notExist: function(){
								// TODO: Add error.
							},
							error: function(){
								// TODO: Add error.
							}
						});

					},
					confirm: function(){
						var dialogEl = document.getElementById("RightsDialog");
						var readRights = dialogEl.getElementsByClassName("read-rights-input")[0];
						var writeRights = dialogEl.getElementsByClassName("write-rights-input")[0];
						SharedContainersOnSwift.updateRights({
							containerName: previousParent.dataset.path,
							readRights: readRights.value,
							writeRights: writeRights.value,
							updated: function(){
								dialogForm.hide();
							},
							error: function(status, statusText){
								// TODO: Change:
								alert("error: " + status + " " + statusText);
							}
						});
					}
				});
			},
			onopen: function(){
				itemCommandName.set("open");
				onItemClick(previousParent);
			},
			ondownload: function(e){
				window.FileManager.toolbox.downloadClick(window.FileManager.elements.originalPath + FileManager.CurrentPath().get() + previousParent.dataset.path, previousParent.dataset.path);
			},
			oncopy: function(){
				oncopy();
			},
			/*onmetadata: function(e){
				var item = previousParent;
				metadataObj.showMetaData(item.dataset.path, item.dataset.type, function(callback){
					window.FileManager.dialogForm.show({
						confirm: function(){
							SwiftV1.updateFileMetadata({
								metadata: metadataObj.getMeta(),
								removeMetadata: metadataObj.getRemovedMeta(),
								contentType: item.dataset.contentType,
								updated: window.FileManager.files.refreshItemList,
								path: window.FileManager.CurrentPath().withoutAccount() + previousParent.dataset.path,
								error: ajaxError,
								notExist: function(){
									window.FileManager.errorMsgHandler.show({
										header: "File not exist"
									});
								}});
							window.FileManager.dialogForm.hide();
						},
						dialogContent: metadataObj.el,
						onshow: callback,
						customizationClass: "metadata",
						type: "dialog"
					});
				});
			},*/
			ontype: function(e){
				window.FileManager.dialogForm.show({
					type: "input",
					placeholder: "New file type",
					customizationClass: "change-type",
					confirm: function(input){
						input.value && SwiftV1.updateFileMetadata({
							contentType: input.value,
							updated: window.FileManager.files.refreshItemList,
							path: window.FileManager.CurrentPath().withoutAccount() + previousParent.dataset.path,
							error: ajaxError,
							notExist: function(){
								window.FileManager.errorMsgHandler.show({
									header: "File not exist"
								});
							}
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
		metadataObj = new MetadataObj;
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
		execute: execute
	};
})();